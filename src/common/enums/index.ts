export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    PARTIAL = 'partial',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
  }
  
  export enum PaymentMode {
    UPI = 'upi',
    BANK_TRANSFER = 'bank_transfer',
    CHEQUE = 'cheque',
    CASH = 'cash',
    CARD = 'card',
  }
  
  export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SETTLED = 'settled',
    FAILED = 'failed',
    REFUNDED = 'refunded',
  }
  
  export enum ExpenseStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    REIMBURSED = 'reimbursed',
  }
  
  export enum ExpenseCategory {
    FOOD_BEVERAGE = 'food_beverage',
    LOGISTICS = 'logistics',
    TRAVEL = 'travel',
    MARKETING = 'marketing',
    VENUE = 'venue',
    DECOR = 'decor',
    MISCELLANEOUS = 'miscellaneous',
  }
  
  export enum VendorBillStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    PAID = 'paid',
    OVERDUE = 'overdue',
  }
  
  export enum PayoutStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DISBURSED = 'disbursed',
  }
  
  export enum Priority {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
  }
  
  export enum GSTReturnType {
    GSTR1 = 'GSTR1',
    GSTR2A = 'GSTR2A',
    GSTR3B = 'GSTR3B',
  }
  
  export enum FilingStatus {
    FILED = 'filed',
    PENDING = 'pending',
    LATE_FILED = 'late_filed',
  }
  
  export enum TDSSection {
    S194C = 's194C',
    S194J = 's194J',
    S194I = 's194I',
    S194H = 's194H',
  }
  
  export enum AuditSeverity {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
  }
  
  export enum DunningLevel {
    L1 = 'L1',
    L2 = 'L2',
    L3 = 'L3',
    L4 = 'L4',
  }
  
  export enum DunningStatus {
    ACTIVE = 'active',
    RESOLVED = 'resolved',
    ESCALATED = 'escalated',
  }
  
  export enum FinanceRole {
    FINANCE_MANAGER = 'finance_manager',
    CFO = 'cfo',
    ACCOUNTANT = 'accountant',
    AUDITOR = 'auditor',
    ACCOUNTS_HEAD = 'accounts_head',
  }
  
  export const VALID_GST_RATES = [0, 5, 12, 18, 28] as const;
  export type GSTRate = (typeof VALID_GST_RATES)[number];
  
  export enum AuditAction {
    INVOICE_CREATED = 'INVOICE_CREATED',
    INVOICE_SENT = 'INVOICE_SENT',
    INVOICE_CANCELLED = 'INVOICE_CANCELLED',
    INVOICE_OVERDUE = 'INVOICE_OVERDUE',
    PAYMENT_RECORDED = 'PAYMENT_RECORDED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    RECONCILIATION_MATCHED = 'RECONCILIATION_MATCHED',
    RECONCILIATION_UNMATCHED = 'RECONCILIATION_UNMATCHED',
    CREDIT_NOTE_CREATED = 'CREDIT_NOTE_CREATED',
    DEBIT_NOTE_CREATED = 'DEBIT_NOTE_CREATED',
    EXPENSE_SUBMITTED = 'EXPENSE_SUBMITTED',
    EXPENSE_APPROVED = 'EXPENSE_APPROVED',
    EXPENSE_REJECTED = 'EXPENSE_REJECTED',
    VENDOR_BILL_UPLOADED = 'VENDOR_BILL_UPLOADED',
    VENDOR_BILL_APPROVED = 'VENDOR_BILL_APPROVED',
    PAYOUT_APPROVED = 'PAYOUT_APPROVED',
    PAYOUT_DISBURSED = 'PAYOUT_DISBURSED',
    DUNNING_L1_SENT = 'DUNNING_L1_SENT',
    DUNNING_L2_SENT = 'DUNNING_L2_SENT',
    DUNNING_L3_SENT = 'DUNNING_L3_SENT',
    DUNNING_L4_ESCALATED = 'DUNNING_L4_ESCALATED',
    GST_RETURN_FILED = 'GST_RETURN_FILED',
    GST_SUMMARY_PREPARED = 'GST_SUMMARY_PREPARED',
  }