import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
import { FinanceGateway } from '../../../shared/socket/finance.gateway';
import {
  AuditAction,
  AuditSeverity,
  DunningLevel,
  DunningStatus,
  InvoiceStatus,
} from '../../../common/enums';
import {
  DUNNING_DAYS,
  JOB_NAMES,
  QUEUE_NAMES,
  SOCKET_EVENTS,
} from '../../../common/constants';
import { AuditContext } from '../../../common/interfaces';
import { DunningFilterDto } from './dto/receivable.dto';

@Injectable()
export class DunningService {
  private readonly logger = new Logger(DunningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditTrailService,
    private readonly gateway: FinanceGateway,
    private readonly config: ConfigService,
    @InjectQueue(QUEUE_NAMES.DUNNING) private readonly dunningQueue: Queue,
  ) {}

  private num(value: unknown): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private levelFor(days: number): {
    level: DunningLevel;
    job: string;
    waitDays: number;
  } {
    if (days >= DUNNING_DAYS.L4_TRIGGER) {
      return { level: DunningLevel.L4, job: JOB_NAMES.ESCALATE_DUNNING_L4, waitDays: 0 };
    }
    if (days >= DUNNING_DAYS.L3_TRIGGER) {
      return { level: DunningLevel.L3, job: JOB_NAMES.SEND_DUNNING_L3, waitDays: 21 };
    }
    if (days >= DUNNING_DAYS.L2_TRIGGER) {
      return { level: DunningLevel.L2, job: JOB_NAMES.SEND_DUNNING_L2, waitDays: 14 };
    }
    return { level: DunningLevel.L1, job: JOB_NAMES.SEND_DUNNING_L1, waitDays: 7 };
  }

  /**
   * Daily scheduled job (00:00 IST per spec). Marks overdue invoices and
   * advances the dunning ladder. Schedule is configurable via DUNNING_CRON.
   */
  @Cron('0 0 0 * * *', { name: 'daily-dunning', timeZone: 'Asia/Kolkata' })
  async runDailyDunning(): Promise<void> {
    this.logger.log('Running daily dunning sweep...');
    const now = new Date();

    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] },
        dueDate: { lt: now },
        amountDue: { gt: 0 },
      },
      include: { customer: true },
    });

    let processed = 0;
    for (const invoice of overdueInvoices) {
      const days = Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / 86_400_000,
      );
      if (days < DUNNING_DAYS.L1_TRIGGER) continue;

      const { level, job, waitDays } = this.levelFor(days);

      if (invoice.status !== InvoiceStatus.OVERDUE) {
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: InvoiceStatus.OVERDUE },
        });
        this.gateway.emit(SOCKET_EVENTS.INVOICE_OVERDUE, {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          daysOverdue: days,
        });
      }

      const nextActionDate = new Date(now);
      nextActionDate.setDate(now.getDate() + waitDays);

      const existing = await this.prisma.dunningRecord.findFirst({
        where: { invoiceId: invoice.id, status: DunningStatus.ACTIVE },
        orderBy: { actionDate: 'desc' },
      });

      if (existing && existing.level === level) {
        continue; // already at this level, awaiting wait period
      }

      await this.prisma.dunningRecord.create({
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          level,
          status:
            level === DunningLevel.L4
              ? DunningStatus.ESCALATED
              : DunningStatus.ACTIVE,
          daysOverdue: days,
          channel: level === DunningLevel.L2 ? 'email+sms' : 'email',
          emailsSent: existing ? existing.emailsSent + 1 : 1,
          actionDate: now,
          nextActionDate,
          notes: `Auto dunning ${level} — ${days} days overdue`,
        },
      });

      await this.dunningQueue.add(job, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customer.name,
        customerEmail: invoice.customer.email,
        daysOverdue: days,
        amountDue: this.num(invoice.amountDue),
        level,
      });

      await this.audit.logWarning(
        `DUNNING_${level}_SENT`,
        'invoice',
        invoice.id,
        `Dunning ${level} triggered for invoice ${invoice.invoiceNumber} (${days} days overdue)`,
      );

      this.gateway.emit(SOCKET_EVENTS.DUNNING_SENT, {
        invoiceId: invoice.id,
        level,
        daysOverdue: days,
      });

      processed++;
    }

    this.logger.log(
      `Dunning sweep complete: ${processed}/${overdueInvoices.length} invoices actioned`,
    );
  }

  async getDunningQueue(filter: DunningFilterDto) {
    const records = await this.prisma.dunningRecord.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.level ? { level: filter.level } : {}),
      },
      orderBy: { actionDate: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            amountDue: true,
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Collapse to one row per customer (latest record wins).
    const byCustomer = new Map<string, (typeof records)[number]>();
    for (const r of records) {
      if (!byCustomer.has(r.customerId)) byCustomer.set(r.customerId, r);
    }

    const queue = await Promise.all(
      Array.from(byCustomer.values()).map(async (r) => {
        const outstanding = await this.prisma.invoice.aggregate({
          _sum: { amountDue: true },
          where: {
            customerId: r.customerId,
            status: { in: ['sent', 'partial', 'overdue'] },
          },
        });
        return {
          id: r.id,
          customerId: r.customerId,
          customerName: r.invoice.customer.name,
          outstandingAmount: this.num(outstanding._sum.amountDue),
          dunningLevel: r.level,
          lastActionDate: r.actionDate,
          nextActionDate: r.nextActionDate,
          emailsSent: r.emailsSent,
          status: r.status,
        };
      }),
    );

    return queue;
  }

  async triggerManualReminder(
    customerId: string,
    userId: string,
    context: AuditContext,
  ) {
    const now = new Date();
    const overdue = await this.prisma.invoice.findMany({
      where: {
        customerId,
        status: { in: ['sent', 'partial', 'overdue'] },
        amountDue: { gt: 0 },
      },
      include: { customer: true },
      orderBy: { dueDate: 'asc' },
    });

    if (overdue.length === 0) {
      throw new NotFoundException(
        'No outstanding invoices found for this customer',
      );
    }

    const oldest = overdue[0];
    const days = Math.max(
      0,
      Math.floor((now.getTime() - oldest.dueDate.getTime()) / 86_400_000),
    );
    const { level, job } = this.levelFor(Math.max(days, DUNNING_DAYS.L1_TRIGGER));

    const record = await this.prisma.dunningRecord.create({
      data: {
        invoiceId: oldest.id,
        customerId,
        level,
        status: DunningStatus.ACTIVE,
        daysOverdue: days,
        channel: 'manual',
        emailsSent: 1,
        actionDate: now,
        notes: `Manual reminder triggered by user ${userId}`,
      },
    });

    await this.dunningQueue.add(job, {
      invoiceId: oldest.id,
      invoiceNumber: oldest.invoiceNumber,
      customerId,
      customerName: oldest.customer.name,
      customerEmail: oldest.customer.email,
      daysOverdue: days,
      amountDue: this.num(oldest.amountDue),
      level,
      manual: true,
    });

    await this.audit.log({
      action: AuditAction.DUNNING_L1_SENT,
      entity: 'customer',
      entityId: customerId,
      description: `Manual payment reminder sent to ${oldest.customer.name}`,
      severity: AuditSeverity.WARNING,
      context,
    });

    return {
      success: true,
      message: `Reminder (${level}) queued for ${oldest.customer.name}`,
      dunningRecordId: record.id,
      invoicesOutstanding: overdue.length,
    };
  }
}
