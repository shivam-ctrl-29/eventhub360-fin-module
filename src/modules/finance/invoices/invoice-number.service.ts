import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * Centralised, transaction-safe sequential document numbering.
 * Produces numbers of the form PREFIX-YYYY-NNNN (e.g. INV-2026-1001).
 *
 * The InvoiceService keeps an internal copy of this logic for backward
 * compatibility; this standalone service is exported for any other module
 * (payments, payouts, notes) that needs to mint a document number.
 */
@Injectable()
export class InvoiceNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(entity: string): Promise<string> {
    const seq = await this.prisma.$transaction(async (tx) => {
      const record = await tx.numberingSequence.findUnique({
        where: { entity },
      });

      if (!record) {
        throw new ConflictException(
          `Numbering sequence not found for entity: ${entity}`,
        );
      }

      await tx.numberingSequence.update({
        where: { entity },
        data: { nextNo: { increment: 1 } },
      });

      return { prefix: record.prefix, nextNo: record.nextNo };
    });

    const year = new Date().getFullYear();
    return `${seq.prefix}-${year}-${String(seq.nextNo).padStart(4, '0')}`;
  }
}
