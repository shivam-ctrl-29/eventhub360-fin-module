import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JOB_NAMES, QUEUE_NAMES } from '../../../common/constants';

interface OcrJobData {
  expenseId: string;
  claimedAmount: number;
  receiptUrl?: string;
}

/**
 * Receipt OCR processor. Extracts the amount from the receipt (stubbed),
 * compares it to the claimed amount and flags the expense when the variance
 * exceeds the configured tolerance (default +/-2%).
 */
@Processor(QUEUE_NAMES.EXPENSE_OCR)
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Process(JOB_NAMES.OCR_RECEIPT)
  async handleOcr(job: Job<OcrJobData>): Promise<{ flagged: boolean }> {
    const { expenseId, claimedAmount } = job.data;
    const tolerance = this.config.get<number>('finance.expenseOcrTolerance', 2);

    // TODO: replace stub with real OCR extraction from job.data.receiptUrl.
    const ocrAmount = claimedAmount;

    const variancePercent =
      claimedAmount > 0
        ? (Math.abs(ocrAmount - claimedAmount) / claimedAmount) * 100
        : 0;
    const flagged = variancePercent > tolerance;

    await this.prisma.expense.update({
      where: { id: expenseId },
      data: { ocrAmount, ocrFlagged: flagged },
    });

    if (flagged) {
      this.logger.warn(
        `Expense ${expenseId} flagged: OCR ${ocrAmount} vs claimed ${claimedAmount} (${variancePercent.toFixed(2)}%)`,
      );
    }

    return { flagged };
  }
}
