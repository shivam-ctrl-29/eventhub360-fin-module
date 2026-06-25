import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { InvoiceModule } from './invoices/invoice.module';
import { PaymentModule } from './payments/payment.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ReceivableModule } from './receivables/receivable.module';
import { PayableModule } from './payables/payable.module';
import { ExpenseModule } from './expenses/expense.module';
import { ReportModule } from './reports/report.module';

@Module({
  imports: [
    DashboardModule,
    InvoiceModule,
    PaymentModule,
    ReconciliationModule,
    ReceivableModule,
    PayableModule,
    ExpenseModule,
    ReportModule,
  ],
})
export class FinanceModule {}
