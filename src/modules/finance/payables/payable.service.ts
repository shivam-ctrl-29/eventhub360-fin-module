import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuditTrailService } from '../../../shared/audit/audit-trail.service';
import { MinioService } from '../../../shared/minio/minio.service';
import {
  AuditAction,
  AuditSeverity,
  PayoutStatus,
  Priority,
  VendorBillStatus,
} from '../../../common/enums';
import { PAYOUT_SLA_DAYS } from '../../../common/constants';
import { AuditContext } from '../../../common/interfaces';
import {
  ApprovePayoutDto,
  DisbursePayoutDto,
  UploadBillDto,
  VendorBillFilterDto,
} from './dto/payable.dto';

@Injectable()
export class PayableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditTrailService,
    private readonly minio: MinioService,
  ) {}

  private num(value: unknown): number {
    return value === null || value === undefined ? 0 : Number(value);
  }

  async getBills(filter: VendorBillFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.priority ? { priority: filter.priority } : {}),
      ...(filter.search
        ? {
            OR: [
              { billNumber: { contains: filter.search, mode: 'insensitive' as const } },
              { vendor: { name: { contains: filter.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [bills, total] = await this.prisma.$transaction([
      this.prisma.vendorBill.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
        skip,
        take: limit,
        include: { vendor: { select: { name: true } } },
      }),
      this.prisma.vendorBill.count({ where }),
    ]);

    return {
      data: bills.map((b) => ({
        id: b.id,
        billNumber: b.billNumber,
        vendorId: b.vendorId,
        vendorName: b.vendor.name,
        amount: this.num(b.amount),
        gstAmount: this.num(b.gstAmount),
        totalAmount: this.num(b.totalAmount),
        billDate: b.billDate,
        dueDate: b.dueDate,
        status: b.status,
        priority: b.priority,
        category: b.category,
        documentUrl: b.documentUrl,
        approvedBy: b.approvedBy,
        approvedAt: b.approvedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async uploadBill(
    dto: UploadBillDto,
    file: { buffer: Buffer; originalname: string; mimetype: string } | undefined,
    context: AuditContext,
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    let documentUrl: string | undefined;
    if (file) {
      documentUrl = await this.minio.uploadFile(
        'bills',
        file.buffer,
        file.originalname,
        file.mimetype,
        'vendor-bills',
      );
    }

    const amount = this.num(dto.amount);
    const gstAmount = this.num(dto.gstAmount);
    const priority = (dto.priority as Priority) || Priority.MEDIUM;

    const bill = await this.prisma.vendorBill.create({
      data: {
        vendorId: dto.vendorId,
        billNumber: dto.billNumber,
        amount,
        gstAmount,
        totalAmount: amount + gstAmount,
        billDate: new Date(dto.billDate),
        dueDate: new Date(dto.dueDate),
        status: VendorBillStatus.PENDING,
        priority,
        category: dto.category,
        documentUrl,
      },
    });

    await this.audit.log({
      action: AuditAction.VENDOR_BILL_UPLOADED,
      entity: 'vendor_bill',
      entityId: bill.id,
      description: `Vendor bill ${bill.billNumber} uploaded for ${vendor.name}`,
      severity: AuditSeverity.INFO,
      context,
    });

    return bill;
  }

  async getPayoutSchedule() {
    const payouts = await this.prisma.payout.findMany({
      where: { status: { in: [PayoutStatus.PENDING, PayoutStatus.APPROVED] } },
      orderBy: [{ priority: 'asc' }, { scheduledDate: 'asc' }],
      include: {
        vendorBill: {
          select: {
            billNumber: true,
            vendor: { select: { id: true, name: true } },
          },
        },
      },
    });

    return payouts.map((p) => ({
      id: p.id,
      vendorId: p.vendorBill.vendor.id,
      vendorName: p.vendorBill.vendor.name,
      billId: p.vendorBillId,
      billNumber: p.vendorBill.billNumber,
      amount: this.num(p.amount),
      scheduledDate: p.scheduledDate,
      priority: p.priority,
      status: p.status,
      approvedBy: p.approvedBy,
    }));
  }

  async approvePayouts(
    dto: ApprovePayoutDto,
    userId: string,
    context: AuditContext,
  ): Promise<{ approved: number }> {
    const payouts = await this.prisma.payout.findMany({
      where: { id: { in: dto.ids } },
    });
    if (payouts.length === 0) {
      throw new BadRequestException('No matching payouts found');
    }

    const now = new Date();
    const result = await this.prisma.payout.updateMany({
      where: { id: { in: dto.ids }, status: PayoutStatus.PENDING },
      data: { status: PayoutStatus.APPROVED, approvedBy: userId, approvedAt: now },
    });

    await this.audit.log({
      action: AuditAction.PAYOUT_APPROVED,
      entity: 'payout',
      entityId: dto.ids.join(','),
      description: `${result.count} payout(s) approved`,
      severity: AuditSeverity.SUCCESS,
      context,
    });

    return { approved: result.count };
  }

  async disbursePayouts(
    dto: DisbursePayoutDto,
    userId: string,
    context: AuditContext,
  ): Promise<{ disbursed: number }> {
    const now = new Date();

    const disbursable = await this.prisma.payout.findMany({
      where: { id: { in: dto.ids }, status: PayoutStatus.APPROVED },
      select: { id: true, vendorBillId: true },
    });

    if (disbursable.length === 0) {
      throw new BadRequestException(
        'No approved payouts available for disbursement',
      );
    }

    const ids = disbursable.map((p) => p.id);
    const billIds = disbursable.map((p) => p.vendorBillId);

    await this.prisma.$transaction([
      this.prisma.payout.updateMany({
        where: { id: { in: ids } },
        data: {
          status: PayoutStatus.DISBURSED,
          disbursedBy: userId,
          disbursedAt: now,
        },
      }),
      this.prisma.vendorBill.updateMany({
        where: { id: { in: billIds } },
        data: { status: VendorBillStatus.PAID },
      }),
    ]);

    await this.audit.log({
      action: AuditAction.PAYOUT_DISBURSED,
      entity: 'payout',
      entityId: ids.join(','),
      description: `${ids.length} payout(s) disbursed`,
      severity: AuditSeverity.SUCCESS,
      context,
    });

    return { disbursed: ids.length };
  }

  /** Default SLA scheduled date helper (used when generating payouts). */
  slaDate(priority: string, from: Date = new Date()): Date {
    const days = PAYOUT_SLA_DAYS[priority as keyof typeof PAYOUT_SLA_DAYS] ?? 7;
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return d;
  }
}
