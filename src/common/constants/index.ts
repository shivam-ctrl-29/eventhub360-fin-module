export const FINANCE_MODULE = 'finance';

export const QUEUE_NAMES = {
  DUNNING: 'fin-dunning',
  INVOICE_EMAIL: 'fin-invoice-email',
  RECONCILIATION: 'fin-reconciliation',
  GST_PREPARE: 'fin-gst-prepare',
  EXPENSE_OCR: 'fin-expense-ocr',
  RECEIPT_PDF: 'fin-receipt-pdf',
} as const;

export const JOB_NAMES = {
  SEND_DUNNING_L1: 'send-dunning-l1',
  SEND_DUNNING_L2: 'send-dunning-l2',
  SEND_DUNNING_L3: 'send-dunning-l3',
  ESCALATE_DUNNING_L4: 'escalate-dunning-l4',
  SEND_INVOICE_EMAIL: 'send-invoice-email',
  AUTO_RECONCILE: 'auto-reconcile',
  PREPARE_GST_SUMMARY: 'prepare-gst-summary',
  OCR_RECEIPT: 'ocr-receipt',
  GENERATE_RECEIPT_PDF: 'generate-receipt-pdf',
} as const;

export const CACHE_KEYS = {
  DASHBOARD: 'fin:dashboard:',
  AR_AGING: 'fin:ar:aging:',
  GST_REPORT: 'fin:gst:report:',
  PNL_REPORT: 'fin:pnl:',
} as const;

export const CACHE_TTL = {
  DASHBOARD: 300,
  AR_AGING: 600,
  GST_REPORT: 3600,
  PNL_REPORT: 1800,
} as const;

export const DUNNING_DAYS = {
  L1_TRIGGER: 1,
  L2_TRIGGER: 8,
  L3_TRIGGER: 22,
  L4_TRIGGER: 43,
} as const;

export const EXPENSE_APPROVAL_THRESHOLDS = {
  TEAM_LEAD_MAX: 5000,
  DEPT_MANAGER_MAX: 100000,
  FINANCE_MANAGER_MAX: 500000,
} as const;

export const PAYOUT_SLA_DAYS = {
  critical: 1,
  high: 3,
  medium: 7,
  low: 15,
} as const;

export const RECONCILIATION_CONFIDENCE = {
  AUTO_MATCH: 95,
  SUGGEST_MATCH: 70,
} as const;

export const INVOICE_NUMBER_FORMAT = 'INV';
export const PAYMENT_NUMBER_FORMAT = 'PAY';
export const CREDIT_NOTE_FORMAT = 'CN';
export const DEBIT_NOTE_FORMAT = 'DN';

export const MAX_LINE_ITEMS = 50;
export const MIN_LINE_ITEMS = 1;
export const MAX_EXPENSE_CLAIM_AMOUNT = 500000;
export const RECEIPT_REQUIRED_ABOVE = 500;
export const EXPENSE_STALE_DAYS = 30;
export const INVOICE_FUTURE_DAYS_ALLOWED = 7;
export const INVOICE_MAX_DUE_DAYS = 365;
export const UNMATCHED_ENTRY_ALERT_DAYS = 30;

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const SOCKET_EVENTS = {
  INVOICE_CREATED: 'fin:invoice:created',
  INVOICE_PAID: 'fin:invoice:paid',
  INVOICE_OVERDUE: 'fin:invoice:overdue',
  PAYMENT_RECORDED: 'fin:payment:recorded',
  EXPENSE_SUBMITTED: 'fin:expense:submitted',
  EXPENSE_APPROVED: 'fin:expense:approved',
  DUNNING_SENT: 'fin:dunning:sent',
} as const;