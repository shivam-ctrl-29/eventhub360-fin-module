import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceLine } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { Expense } from './entities/expense.entity';
import { Payout } from './entities/payout-schedule.entity';
import { CreditNote } from './entities/credit-note.entity';
import { Pnl } from './entities/pnl.entity';
import { FinAuditTrail } from './entities/fin-audit.entity';
import { VendorBill } from './entities/vendor-bill.entity';
import { InvoiceService } from './services/invoice.service';
import { PaymentService } from './services/payment.service';
import { ExpenseService } from './services/expense.service';
import { PayableService } from './services/payable.service';
import { ReconciliationService } from './services/reconciliation.service';
import { ReportService } from './services/report.service';
import { DashboardService } from './services/dashboard.service';
import { AuditService } from './services/audit.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { InvoiceController } from './controllers/invoice.controller';
import { PaymentController } from './controllers/payment.controller';
import { ExpenseController } from './controllers/expense.controller';
import { PayableController } from './controllers/payable.controller';
import { ReconciliationController } from './controllers/reconciliation.controller';
import { ReportController } from './controllers/report.controller';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice, InvoiceLine, Payment, Expense, Payout,
      CreditNote, Pnl, FinAuditTrail, VendorBill,
    ]),
  ],
  controllers: [
    DashboardController, InvoiceController, PaymentController,
    ExpenseController, PayableController, ReconciliationController, ReportController,
  ],
  providers: [
    DashboardService, InvoiceService, PaymentService,
    ExpenseService, PayableService, ReconciliationService, ReportService, AuditService,
    ExchangeRateService,
  ],
  exports: [AuditService],
})
export class FinanceModule {}
