import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Job, Queue } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
import {
  AuditAction,
  AuditSeverity,
  FilingStatus,
  GSTReturnType,
} from '../../../common/enums';
import { JOB_NAMES, QUEUE_NAMES } from '../../../common/constants';

interface PrepareGstJobData {
  period?: string;
}

@Injectable()
@Processor(QUEUE_NAMES.GST_PREPARE)
export class GstFilingProcessor {
  private readonly logger = new Logger(GstFilingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditTrailService,
    @InjectQueue(QUEUE_NAMES.GST_PREPARE) private readonly gstQueue: Queue,
  ) {}

  private num(value: unknown): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  /** Enqueue GST summary preparation on the 1st of every month at 02:00 IST. */
  @Cron('0 0 2 1 * *', { name: 'monthly-gst-prepare', timeZone: 'Asia/Kolkata' })
  async scheduleMonthly(): Promise<void> {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    this.logger.log(`Scheduling GST summary preparation for ${period}`);
    await this.gstQueue.add(JOB_NAMES.PREPARE_GST_SUMMARY, { period });
  }

  @Process(JOB_NAMES.PREPARE_GST_SUMMARY)
  async prepareSummary(
    job: Job<PrepareGstJobData>,
  ): Promise<{ period: string; netPayable: number }> {
    const now = new Date();
    const period =
      job.data.period ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [year, month] = period.split('-').map((n) => parseInt(n, 10));
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Output GST from invoices issued in the period.
    const outputAgg = await this.prisma.invoice.aggregate({
      _sum: { totalGst: true },
      where: {
        status: { in: ['sent', 'partial', 'paid', 'overdue'] },
        issueDate: { gte: start, lt: end },
      },
    });

    // Input GST (ITC) from approved/paid vendor bills in the period.
    const inputAgg = await this.prisma.vendorBill.aggregate({
      _sum: { gstAmount: true },
      where: {
        status: { in: ['approved', 'paid'] },
        billDate: { gte: start, lt: end },
      },
    });

    const gstOutput = this.num(outputAgg._sum.totalGst);
    const gstInput = this.num(inputAgg._sum.gstAmount);
    const netPayable = Math.max(0, gstOutput - gstInput);

    // GSTR3B due on the 20th of the following month.
    const dueDate = new Date(year, month, 20);
    const itcUtilized = Math.min(gstInput, gstOutput);

    // Nullable branchId makes the compound unique unreliable for upsert,
    // so we match the company-level (branchId null) filing manually.
    const existing = await this.prisma.gSTFiling.findFirst({
      where: { branchId: null, period, returnType: GSTReturnType.GSTR3B },
    });

    if (existing) {
      await this.prisma.gSTFiling.update({
        where: { id: existing.id },
        data: {
          gstOutput,
          gstInput,
          itcAvailable: gstInput,
          itcUtilized,
          netPayable,
          filingStatus: FilingStatus.PENDING,
          dueDate,
        },
      });
    } else {
      await this.prisma.gSTFiling.create({
        data: {
          period,
          returnType: GSTReturnType.GSTR3B,
          gstOutput,
          gstInput,
          itcAvailable: gstInput,
          itcUtilized,
          netPayable,
          filingStatus: FilingStatus.PENDING,
          dueDate,
        },
      });
    }

    await this.audit.log({
      action: AuditAction.GST_SUMMARY_PREPARED,
      entity: 'gst_filing',
      entityId: period,
      description: `GST summary prepared for ${period}: output ${gstOutput}, ITC ${gstInput}, net ${netPayable}`,
      severity: AuditSeverity.INFO,
    });

    this.logger.log(`GST summary prepared for ${period} (net payable ${netPayable})`);
    return { period, netPayable };
  }
}
