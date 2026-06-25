import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '../../../common/constants';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { OcrProcessor } from './ocr.processor';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.EXPENSE_OCR })],
  controllers: [ExpenseController],
  providers: [ExpenseService, OcrProcessor],
  exports: [ExpenseService],
})
export class ExpenseModule {}
