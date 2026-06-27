import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceNumberService } from './invoice-number.service';
import { GSTCalculationEngine } from './gst-calculation.engine';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceNumberService, GSTCalculationEngine],
  exports: [InvoiceService, InvoiceNumberService, GSTCalculationEngine],
})
export class InvoiceModule {}
