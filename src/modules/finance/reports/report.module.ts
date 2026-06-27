import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '../../../common/constants';
import { InvoiceModule } from '../invoices/invoice.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { GstFilingProcessor } from './gst-filing.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.GST_PREPARE }),
    InvoiceModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, GstFilingProcessor],
  exports: [ReportService],
})
export class ReportModule {}
