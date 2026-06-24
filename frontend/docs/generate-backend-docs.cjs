const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TableOfContents
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "8B1A1A" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

const cm = (n) => n; // margins in DXA

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "8B1A1A" })],
    spacing: { before: 400, after: 200 },
    pageBreakBefore: true,
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "1a2a4a" })],
    spacing: { before: 280, after: 120 },
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: "334155" })],
    spacing: { before: 200, after: 80 },
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 20, ...opts })],
    spacing: { after: 100 },
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: "Arial", size: 20 })],
    spacing: { after: 60 },
  });
}
function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders: headerBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "8B1A1A", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", font: "Arial", size: 18 })] })],
        })),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => new TableCell({
          borders,
          width: { size: colWidths[ci], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "FFFFFF" : "FBF8F5", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Arial", size: 18 })] })],
        })),
      })),
    ],
  });
}

// ──────────────────────────────────────────────
// CONTENT
// ──────────────────────────────────────────────

const titlePage = [
  spacer(), spacer(), spacer(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "EventHub 360", font: "Arial", size: 52, bold: true, color: "8B1A1A" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Finance & Accounting Module (FIN)", font: "Arial", size: 36, bold: true, color: "1a2a4a" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Backend Architecture & API Specification", font: "Arial", size: 28, color: "334155" })] }),
  spacer(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Version: 1.0  |  Date: June 2026  |  Status: PRE-IMPLEMENTATION", font: "Arial", size: 20, color: "94a3b8" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared for: Engineering Team Handoff", font: "Arial", size: 20, color: "94a3b8" })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

// TOC
const toc = [
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ─── SECTION 1: API SPECIFICATION ───
const sec1 = [
  h1("1. API Specification"),
  p("All Finance module APIs are prefixed with /api/fin. Every response follows a standard envelope:"),
  spacer(),
  h3("1.1 Standard Response Envelope"),
  makeTable(
    ["Field", "Type", "Description"],
    [
      ["success", "boolean", "true if request succeeded"],
      ["data", "T", "Payload — varies by endpoint"],
      ["message", "string (optional)", "Human-readable status or error message"],
    ],
    [2000, 2000, 5026]
  ),
  spacer(),
  h3("1.2 Standard Error Codes"),
  makeTable(
    ["HTTP Status", "Code", "Description"],
    [
      ["200", "OK", "Request successful"],
      ["201", "CREATED", "Resource created successfully"],
      ["400", "BAD_REQUEST", "Validation failed — see errors array"],
      ["401", "UNAUTHORIZED", "JWT token missing or expired"],
      ["403", "FORBIDDEN", "Authenticated but insufficient role/permission"],
      ["404", "NOT_FOUND", "Resource does not exist"],
      ["409", "CONFLICT", "Duplicate entry (invoice number, UTR, etc.)"],
      ["422", "UNPROCESSABLE_ENTITY", "Business rule violation"],
      ["500", "INTERNAL_SERVER_ERROR", "Unexpected server error"],
    ],
    [1800, 2200, 5026]
  ),
  spacer(),

  h2("1.3 Dashboard APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/dashboard", "CFO KPIs — revenue, receivables, payables, margin, tax, cash forecast", "finance_manager, cfo"],
      ["GET", "/api/fin/dashboard/revenue-trends", "Monthly revenue vs expenses for given year", "finance_manager, cfo"],
      ["GET", "/api/fin/branch-performance", "Per-branch revenue, expenses, profit, growth %", "finance_manager, cfo"],
      ["GET", "/api/fin/cash-health", "Net liquidity, OPEX runway, health score, weekly forecast", "finance_manager, cfo"],
    ],
    [900, 2800, 3500, 1826]
  ),
  spacer(),

  h2("1.4 Invoice APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/invoices", "List invoices with filters (status, customer, date range, pagination)", "finance_manager"],
      ["POST", "/api/fin/invoices", "Create new invoice (draft)", "finance_manager"],
      ["GET", "/api/fin/invoices/:id", "Get single invoice with full line items and GST breakdown", "finance_manager"],
      ["PATCH", "/api/fin/invoices/:id", "Update invoice (only if status=draft)", "finance_manager"],
      ["POST", "/api/fin/invoices/:id/send", "Change status draft -> sent, trigger email to customer", "finance_manager"],
      ["GET", "/api/fin/invoices/credit-notes", "List all credit notes", "finance_manager"],
      ["POST", "/api/fin/invoices/credit-notes", "Create credit note against an invoice", "finance_manager"],
      ["GET", "/api/fin/invoices/debit-notes", "List all debit notes", "finance_manager"],
      ["POST", "/api/fin/invoices/debit-notes", "Create debit note against a vendor bill", "finance_manager"],
    ],
    [900, 2800, 3400, 1926]
  ),
  spacer(),

  h3("Invoice Request Body (POST /api/fin/invoices)"),
  makeTable(
    ["Field", "Type", "Required", "Description"],
    [
      ["customerId", "string (UUID)", "Yes", "Customer ID from CRM module"],
      ["issueDate", "string (ISO date)", "Yes", "Invoice issue date YYYY-MM-DD"],
      ["dueDate", "string (ISO date)", "Yes", "Payment due date YYYY-MM-DD"],
      ["lineItems", "array", "Yes", "At least one line item required"],
      ["lineItems[].description", "string", "Yes", "Service/product description max 200 chars"],
      ["lineItems[].quantity", "number", "Yes", "Min 0.01, max 99999"],
      ["lineItems[].unitPrice", "number", "Yes", "Min 0.01 INR"],
      ["lineItems[].gstRate", "0|5|12|18|28", "Yes", "GST rate applicable to this line item"],
      ["paymentMode", "string enum", "No", "upi | bank_transfer | cheque | cash | card"],
      ["notes", "string", "No", "Internal notes max 500 chars"],
    ],
    [2200, 1800, 1000, 4026]
  ),
  spacer(),

  h2("1.5 Payment APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/payments", "List all payments with pagination and filters", "finance_manager"],
      ["POST", "/api/fin/payments", "Record a new payment against an invoice", "finance_manager"],
      ["GET", "/api/fin/payments/:id/receipt", "Get formatted receipt for a payment", "finance_manager"],
    ],
    [900, 2800, 3400, 1926]
  ),
  spacer(),

  h2("1.6 Reconciliation APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/reconciliation", "List bank entries, filter by reconciled=true/false", "finance_manager"],
      ["POST", "/api/fin/reconciliation/:id/match", "Match a bank entry to an invoice by invoiceId", "finance_manager"],
      ["POST", "/api/fin/reconciliation/:id/unmatch", "Remove match from a previously reconciled entry", "finance_manager"],
    ],
    [900, 2800, 3400, 1926]
  ),
  spacer(),

  h2("1.7 Receivables (AR) APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/ar/aging/summary", "Total outstanding, avg collection days, bucket totals", "finance_manager"],
      ["GET", "/api/fin/ar/aging", "Full AR aging entries per customer", "finance_manager"],
      ["GET", "/api/fin/ar/dunning", "Dunning queue with L1/L2/L3 levels", "finance_manager"],
      ["POST", "/api/fin/ar/dunning/:customerId/remind", "Trigger dunning email/call action for a customer", "finance_manager"],
    ],
    [900, 2800, 3400, 1926]
  ),
  spacer(),

  h2("1.8 Payables (AP) APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/ap/bills", "List vendor bills with status filter", "finance_manager"],
      ["POST", "/api/fin/ap/bills/upload", "Upload vendor bill (multipart/form-data)", "finance_manager"],
      ["GET", "/api/fin/ap/payouts", "Payout schedule — all pending/approved disbursements", "finance_manager"],
      ["POST", "/api/fin/ap/payouts/approve", "Approve selected payout IDs (array)", "finance_manager"],
      ["POST", "/api/fin/ap/payouts/disburse", "Mark selected payout IDs as disbursed", "finance_manager, accounts_head"],
    ],
    [900, 2800, 3400, 1926]
  ),
  spacer(),

  h2("1.9 Expense APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/expenses", "List expenses with status and category filters", "finance_manager"],
      ["POST", "/api/fin/expenses/:id/approve", "Approve an employee expense claim", "finance_manager"],
      ["POST", "/api/fin/expenses/:id/reject", "Reject expense claim with reason", "finance_manager"],
      ["GET", "/api/fin/expenses/budget", "Budget vs actual by category for given month/year", "finance_manager"],
    ],
    [900, 2800, 3400, 1926]
  ),
  spacer(),

  h2("1.10 Reports APIs"),
  makeTable(
    ["Method", "Endpoint", "Description", "Auth Role"],
    [
      ["GET", "/api/fin/reports/gst", "GST monthly summary for a financial year", "finance_manager, cfo"],
      ["GET", "/api/fin/reports/gst/compliance-score", "GST compliance score with grade breakdown", "finance_manager, cfo"],
      ["GET", "/api/fin/reports/gst/hsn", "HSN-wise GST breakdown (paginated)", "finance_manager"],
      ["GET", "/api/fin/reports/tds", "TDS deduction entries for a period", "finance_manager"],
      ["GET", "/api/fin/reports/pnl", "P&L for a specific event or overall", "finance_manager, cfo"],
      ["GET", "/api/fin/reports/pnl/monthly", "Monthly P&L for a full financial year", "finance_manager, cfo"],
      ["GET", "/api/fin/reports/audit", "Audit trail with severity, user, action filters", "finance_manager, cfo, auditor"],
    ],
    [900, 2800, 3400, 1926]
  ),
];

// ─── SECTION 2: BUSINESS LOGIC ───
const sec2 = [
  h1("2. Business Logic Document"),

  h2("2.1 GST Calculation Rules"),
  p("The frontend sends raw line item data. The backend is responsible for all GST computation."),
  spacer(),
  makeTable(
    ["GST Rate", "CGST", "SGST", "IGST (Inter-State)", "Applicable Services"],
    [
      ["0%", "0%", "0%", "0%", "Essential services, exempted categories"],
      ["5%", "2.5%", "2.5%", "5%", "Economy hotel stays, basic event services"],
      ["12%", "6%", "6%", "12%", "Mid-range hotels, standard event planning"],
      ["18%", "9%", "9%", "18%", "Premium venues, catering, decor, logistics"],
      ["28%", "14%", "14%", "28%", "Luxury hotels, gambling, entertainment"],
    ],
    [1200, 1000, 1000, 1800, 4026]
  ),
  spacer(),
  p("Intra-state transaction: GST = CGST + SGST (equal split)."),
  p("Inter-state transaction: GST = IGST only. Determined by comparing supplier GSTIN state vs customer GSTIN state."),
  p("Formula: Tax Amount = (Unit Price x Quantity) x (GST Rate / 100)"),
  p("Grand Total = Sum of all line item (taxable amounts) + Sum of all GST amounts"),
  spacer(),

  h2("2.2 Invoice Lifecycle"),
  makeTable(
    ["Status", "Description", "Allowed Transitions", "Trigger"],
    [
      ["DRAFT", "Created but not sent to customer", "SENT, CANCELLED", "Invoice created via POST /invoices"],
      ["SENT", "Emailed to customer, awaiting payment", "PAID, PARTIAL, OVERDUE, CANCELLED", "POST /invoices/:id/send"],
      ["PARTIAL", "Partial payment received", "PAID, OVERDUE", "Payment recorded, amount < invoice total"],
      ["PAID", "Fully paid", "None (terminal)", "Payment recorded, amount = invoice total"],
      ["OVERDUE", "Due date passed, payment pending", "PAID, PARTIAL", "Scheduled job runs daily at midnight"],
      ["CANCELLED", "Voided — issue Credit Note instead", "None (terminal)", "Only finance_manager can cancel"],
    ],
    [1200, 2200, 2200, 3426]
  ),
  spacer(),
  p("IMPORTANT: No invoice can be deleted. Cancellation is the only way to void an invoice. A Credit Note must be issued to reverse accounting impact."),
  spacer(),

  h2("2.3 Dunning Workflow"),
  p("Dunning is triggered when an invoice crosses its due date. Levels escalate automatically."),
  spacer(),
  makeTable(
    ["Level", "Trigger", "Action", "Waiting Period"],
    [
      ["L1 - Soft Reminder", "1 day past due", "Automated email: polite payment reminder", "7 days"],
      ["L2 - Follow-up", "8 days past due", "Automated email + SMS + CRM task for account manager", "14 days"],
      ["L3 - Demand Letter", "22 days past due", "Formal demand letter PDF sent via email, flagged in dashboard", "21 days"],
      ["L4 - Legal Escalation", "43 days past due", "Manual escalation — finance_head approval required, legal team notified", "Manual"],
    ],
    [1600, 2000, 3000, 2426]
  ),
  spacer(),
  p("Dunning stops immediately when full payment is received. Partial payments reset the dunning clock."),
  spacer(),

  h2("2.4 Reconciliation Rules"),
  bullet("Bank feed entries are imported daily via bank integration or manual CSV upload."),
  bullet("Each bank entry has a unique UTR (Unique Transaction Reference) number."),
  bullet("Matching is done by: UTR lookup first, then amount + date proximity (within 3 days, same amount)."),
  bullet("Auto-match confidence > 95%: system auto-reconciles and logs in audit trail."),
  bullet("Auto-match confidence 70-95%: system suggests match, finance_manager confirms."),
  bullet("Auto-match confidence < 70%: entry stays in unmatched queue."),
  bullet("One bank entry can only match one invoice. Multiple invoices cannot share a single UTR."),
  bullet("Unmatched entries older than 30 days trigger an alert to finance_manager."),
  spacer(),

  h2("2.5 Expense Approval Chain"),
  makeTable(
    ["Amount Range", "Approver Level 1", "Approver Level 2", "SLA"],
    [
      ["Up to Rs 5,000", "Team Lead", "—", "1 business day"],
      ["Rs 5,001 to Rs 25,000", "Department Manager", "—", "2 business days"],
      ["Rs 25,001 to Rs 1,00,000", "Department Manager", "Finance Manager", "3 business days"],
      ["Above Rs 1,00,000", "Finance Manager", "CFO / Finance Head", "5 business days"],
    ],
    [2000, 2000, 2000, 3026]
  ),
  spacer(),
  p("Expenses with receipts missing are auto-flagged. OCR validation checks receipt amount vs claimed amount (tolerance: +-2%)."),
  spacer(),

  h2("2.6 Payout Approval Rules"),
  bullet("CRITICAL priority: must be paid within 24 hours of due date."),
  bullet("HIGH priority: within 3 business days."),
  bullet("MEDIUM priority: within 7 business days."),
  bullet("LOW priority: within 15 business days."),
  bullet("Batch disbursal: finance_manager can approve multiple payouts. Actual bank transfer triggered by accounts_head only."),
  bullet("No payout can be reversed once marked DISBURSED. A debit note must be raised for corrections."),
];

// ─── SECTION 3: DATABASE MAPPING ───
const sec3 = [
  h1("3. Database Mapping (Preliminary)"),
  p("NOTE: This is a preliminary mapping based on API contracts and frontend type definitions. Final schema will be provided by the DBA. Column names, indexes, and constraints are subject to change."),
  spacer(),

  h2("3.1 invoices"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK, DEFAULT gen_random_uuid()", "Primary key"],
      ["invoice_number", "VARCHAR(20)", "UNIQUE, NOT NULL", "Format: INV-YYYY-NNNN"],
      ["customer_id", "UUID", "FK -> customers.id, NOT NULL", "Reference to CRM customers table"],
      ["status", "ENUM", "NOT NULL, DEFAULT 'draft'", "draft|sent|partial|paid|overdue|cancelled"],
      ["issue_date", "DATE", "NOT NULL", "Invoice issue date"],
      ["due_date", "DATE", "NOT NULL", "Payment due date"],
      ["subtotal", "DECIMAL(15,2)", "NOT NULL", "Sum of all line item taxable amounts"],
      ["total_gst", "DECIMAL(15,2)", "NOT NULL", "Sum of all GST amounts"],
      ["grand_total", "DECIMAL(15,2)", "NOT NULL", "subtotal + total_gst"],
      ["payment_mode", "ENUM", "NULLABLE", "upi|bank_transfer|cheque|cash|card"],
      ["notes", "TEXT", "NULLABLE", "Internal notes"],
      ["created_by", "UUID", "FK -> users.id, NOT NULL", "User who created the invoice"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL, DEFAULT now()", "Creation timestamp"],
      ["updated_at", "TIMESTAMPTZ", "NOT NULL, DEFAULT now()", "Last update timestamp"],
    ],
    [2000, 1800, 2400, 2826]
  ),
  spacer(),

  h2("3.2 invoice_line_items"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK", "Primary key"],
      ["invoice_id", "UUID", "FK -> invoices.id, NOT NULL, ON DELETE CASCADE", "Parent invoice"],
      ["description", "VARCHAR(200)", "NOT NULL", "Service/product description"],
      ["quantity", "DECIMAL(10,2)", "NOT NULL, CHECK > 0", "Quantity"],
      ["unit_price", "DECIMAL(15,2)", "NOT NULL, CHECK > 0", "Price per unit in INR"],
      ["gst_rate", "SMALLINT", "NOT NULL, CHECK IN (0,5,12,18,28)", "GST rate percentage"],
      ["gst_amount", "DECIMAL(15,2)", "NOT NULL", "Computed: (qty * unit_price) * gst_rate/100"],
      ["total", "DECIMAL(15,2)", "NOT NULL", "Computed: taxable + gst_amount"],
      ["sort_order", "SMALLINT", "NOT NULL, DEFAULT 0", "Display order of line items"],
    ],
    [2000, 1800, 2800, 2426]
  ),
  spacer(),

  h2("3.3 payments"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK", "Primary key"],
      ["payment_number", "VARCHAR(20)", "UNIQUE, NOT NULL", "Format: PAY-YYYY-NNNN"],
      ["invoice_id", "UUID", "FK -> invoices.id, NOT NULL", "Invoice being paid"],
      ["amount", "DECIMAL(15,2)", "NOT NULL, CHECK > 0", "Payment amount in INR"],
      ["payment_mode", "ENUM", "NOT NULL", "upi|bank_transfer|cheque|cash|card"],
      ["utr_number", "VARCHAR(50)", "UNIQUE, NULLABLE", "Bank UTR — unique per transaction"],
      ["cheque_number", "VARCHAR(20)", "NULLABLE", "Cheque number if mode=cheque"],
      ["bank_name", "VARCHAR(100)", "NULLABLE", "Bank name for cheque/transfer"],
      ["status", "ENUM", "NOT NULL, DEFAULT 'pending'", "pending|processing|settled|failed|refunded"],
      ["payment_date", "DATE", "NOT NULL", "Date payment was made"],
      ["remarks", "TEXT", "NULLABLE", "Additional notes"],
      ["recorded_by", "UUID", "FK -> users.id", "User who recorded payment"],
      ["created_at", "TIMESTAMPTZ", "NOT NULL, DEFAULT now()", ""],
    ],
    [2000, 1800, 2400, 2826]
  ),
  spacer(),

  h2("3.4 bank_reconciliation_entries"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK", "Primary key"],
      ["bank_description", "TEXT", "NOT NULL", "Raw bank statement description"],
      ["utr_number", "VARCHAR(50)", "UNIQUE, NOT NULL", "Bank UTR number"],
      ["amount", "DECIMAL(15,2)", "NOT NULL", "Transaction amount"],
      ["transaction_date", "DATE", "NOT NULL", "Date of bank transaction"],
      ["matched_invoice_id", "UUID", "FK -> invoices.id, NULLABLE", "Matched invoice — null if unmatched"],
      ["is_reconciled", "BOOLEAN", "NOT NULL, DEFAULT false", "Reconciliation status"],
      ["reconciled_by", "UUID", "FK -> users.id, NULLABLE", "User who reconciled"],
      ["reconciled_at", "TIMESTAMPTZ", "NULLABLE", "When reconciliation happened"],
    ],
    [2200, 1800, 2400, 2626]
  ),
  spacer(),

  h2("3.5 vendor_bills"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK", ""],
      ["bill_number", "VARCHAR(50)", "NOT NULL", "Vendor's bill number"],
      ["vendor_id", "UUID", "FK -> vendors.id, NOT NULL", "Vendor reference"],
      ["amount", "DECIMAL(15,2)", "NOT NULL", "Bill amount before GST"],
      ["gst_amount", "DECIMAL(15,2)", "NOT NULL", "GST on the bill (ITC eligible)"],
      ["total_amount", "DECIMAL(15,2)", "NOT NULL", "amount + gst_amount"],
      ["bill_date", "DATE", "NOT NULL", "Date on vendor bill"],
      ["due_date", "DATE", "NOT NULL", "Payment due date"],
      ["status", "ENUM", "NOT NULL, DEFAULT 'pending'", "pending|approved|paid|overdue"],
      ["priority", "ENUM", "NOT NULL, DEFAULT 'medium'", "critical|high|medium|low"],
      ["category", "VARCHAR(100)", "NOT NULL", "Expense category"],
      ["document_url", "TEXT", "NULLABLE", "S3 URL of uploaded bill scan"],
      ["created_at", "TIMESTAMPTZ", "DEFAULT now()", ""],
    ],
    [2000, 1800, 2400, 2826]
  ),
  spacer(),

  h2("3.6 expenses"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK", ""],
      ["employee_id", "UUID", "FK -> users.id, NOT NULL", "Employee submitting claim"],
      ["category", "ENUM", "NOT NULL", "food_beverage|logistics|travel|marketing|venue|decor|miscellaneous"],
      ["description", "TEXT", "NOT NULL", "What the expense was for"],
      ["amount", "DECIMAL(15,2)", "NOT NULL, CHECK > 0", "Claimed amount in INR"],
      ["receipt_url", "TEXT", "NULLABLE", "S3 URL of receipt image"],
      ["submitted_date", "DATE", "NOT NULL", "Date submitted for approval"],
      ["status", "ENUM", "NOT NULL, DEFAULT 'pending'", "pending|approved|rejected|reimbursed"],
      ["approved_by", "UUID", "FK -> users.id, NULLABLE", "Approving manager"],
      ["approved_date", "DATE", "NULLABLE", "Approval date"],
      ["remarks", "TEXT", "NULLABLE", "Rejection reason or notes"],
    ],
    [2000, 1800, 2400, 2826]
  ),
  spacer(),

  h2("3.7 gst_filings"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK", ""],
      ["period", "VARCHAR(7)", "NOT NULL", "Format: YYYY-MM (e.g. 2024-04)"],
      ["return_type", "ENUM", "NOT NULL", "GSTR1|GSTR2A|GSTR3B"],
      ["gst_output", "DECIMAL(15,2)", "NOT NULL", "GST collected from customers"],
      ["gst_input", "DECIMAL(15,2)", "NOT NULL", "ITC from vendor bills"],
      ["itc_available", "DECIMAL(15,2)", "NOT NULL", "Net ITC available"],
      ["itc_utilized", "DECIMAL(15,2)", "NOT NULL", "ITC actually used"],
      ["net_payable", "DECIMAL(15,2)", "NOT NULL", "gst_output - itc_utilized"],
      ["filing_status", "ENUM", "NOT NULL, DEFAULT 'pending'", "filed|pending|late_filed"],
      ["filed_date", "DATE", "NULLABLE", "Actual filing date"],
      ["due_date", "DATE", "NOT NULL", "Government due date"],
    ],
    [2000, 1800, 2400, 2826]
  ),
  spacer(),

  h2("3.8 audit_trail"),
  makeTable(
    ["Column", "Type", "Constraints", "Description"],
    [
      ["id", "UUID", "PK", ""],
      ["timestamp", "TIMESTAMPTZ", "NOT NULL, DEFAULT now()", "Exact time of action"],
      ["user_id", "UUID", "FK -> users.id, NOT NULL", "User who performed action"],
      ["action", "VARCHAR(100)", "NOT NULL", "e.g. INVOICE_CREATED, PAYMENT_RECORDED"],
      ["entity", "VARCHAR(50)", "NOT NULL", "e.g. invoice, payment, expense"],
      ["entity_id", "UUID", "NOT NULL", "ID of the affected record"],
      ["description", "TEXT", "NOT NULL", "Human-readable description"],
      ["severity", "ENUM", "NOT NULL", "info|success|warning|error"],
      ["ip_address", "INET", "NULLABLE", "Client IP address"],
      ["metadata", "JSONB", "NULLABLE", "Additional context (old/new values)"],
    ],
    [1800, 1800, 2400, 3026]
  ),
];

// ─── SECTION 4: VALIDATION RULES ───
const sec4 = [
  h1("4. Validation Rules"),
  p("All validation is enforced server-side. Frontend validation is a UX aid only — never trusted."),
  spacer(),

  h2("4.1 Invoice Validation"),
  makeTable(
    ["Field", "Rule", "Error Message"],
    [
      ["invoiceNumber", "Auto-generated — not in request body", "—"],
      ["customerId", "Must be valid UUID and exist in customers table", "Customer not found"],
      ["issueDate", "Must be valid ISO date, not in the future by more than 7 days", "Issue date cannot be more than 7 days in the future"],
      ["dueDate", "Must be >= issueDate, max 365 days from issueDate", "Due date must be after issue date and within 1 year"],
      ["lineItems", "Minimum 1 item, maximum 50 items", "Invoice must have at least 1 line item"],
      ["lineItems[].description", "1-200 characters, no HTML", "Description must be 1-200 characters"],
      ["lineItems[].quantity", "Numeric, min 0.01, max 99999, max 2 decimal places", "Quantity must be between 0.01 and 99999"],
      ["lineItems[].unitPrice", "Numeric, min 0.01 INR, max 9,999,999 INR", "Unit price must be between Rs 0.01 and Rs 99,99,999"],
      ["lineItems[].gstRate", "Must be one of: 0, 5, 12, 18, 28", "Invalid GST rate. Must be 0, 5, 12, 18, or 28"],
      ["grandTotal", "Must be > 0 after calculation", "Invoice total cannot be zero"],
    ],
    [2200, 3500, 3326]
  ),
  spacer(),

  h2("4.2 Payment Validation"),
  makeTable(
    ["Field", "Rule", "Error Message"],
    [
      ["invoiceId", "Must exist, status must be sent/partial/overdue (not draft/paid/cancelled)", "Invoice is not eligible for payment"],
      ["amount", "Must be > 0, cannot exceed outstanding balance on invoice", "Payment amount exceeds invoice outstanding balance"],
      ["paymentMode", "Must be one of: upi, bank_transfer, cheque, cash, card", "Invalid payment mode"],
      ["utrNumber", "Required if mode = upi or bank_transfer, must be unique across all payments", "UTR number already recorded"],
      ["chequeNumber", "Required if mode = cheque, alphanumeric max 20 chars", "Invalid cheque number"],
      ["paymentDate", "Must be valid date, cannot be in the future, cannot be before invoice issueDate", "Invalid payment date"],
    ],
    [2200, 3800, 3026]
  ),
  spacer(),

  h2("4.3 Expense Validation"),
  makeTable(
    ["Field", "Rule", "Error Message"],
    [
      ["employeeId", "Must be valid user ID, role must be employee/staff (not admin)", "Invalid employee"],
      ["category", "Must be one of: food_beverage, logistics, travel, marketing, venue, decor, miscellaneous", "Invalid expense category"],
      ["amount", "Min Rs 1, max Rs 5,00,000 per single claim", "Expense amount must be between Rs 1 and Rs 5,00,000"],
      ["description", "5-500 characters", "Description must be 5-500 characters"],
      ["submittedDate", "Cannot be more than 30 days in the past (stale claims rejected)", "Expense claims older than 30 days cannot be submitted"],
      ["receiptUrl", "Required for amounts above Rs 500, must be valid S3 URL", "Receipt required for expenses above Rs 500"],
    ],
    [2000, 3500, 3526]
  ),
  spacer(),

  h2("4.4 GST/TDS Validation"),
  makeTable(
    ["Field", "Rule", "Error Message"],
    [
      ["gstin", "Must match regex: [0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}", "Invalid GSTIN format"],
      ["pan", "Must match regex: [A-Z]{5}[0-9]{4}[A-Z]{1}", "Invalid PAN format"],
      ["period", "Format YYYY-MM, not in future, not older than 7 years", "Invalid period"],
      ["hsnCode", "Must be 4 or 8 digit numeric code", "Invalid HSN code"],
      ["filingStatus", "Can only be updated from pending -> filed or pending -> late_filed", "Invalid status transition"],
    ],
    [2000, 3800, 3226]
  ),
  spacer(),

  h2("4.5 Vendor Bill Validation"),
  makeTable(
    ["Field", "Rule", "Error Message"],
    [
      ["vendorId", "Must exist in vendors table and be active", "Vendor not found or inactive"],
      ["billNumber", "Max 50 chars, unique per vendor", "Bill number already exists for this vendor"],
      ["totalAmount", "Must be > 0, must equal amount + gst_amount", "Bill total does not match amount + GST"],
      ["dueDate", "Must be >= billDate", "Due date cannot be before bill date"],
      ["priority", "Must be one of: critical, high, medium, low", "Invalid priority level"],
    ],
    [2000, 3500, 3526]
  ),
];

// ─── SECTION 5: SERVICE FLOWS ───
const sec5 = [
  h1("5. Service Flow Diagrams"),
  p("Textual representation of data flows between services. Visual diagrams to be created by the architecture team."),
  spacer(),

  h2("5.1 Invoice Creation & Sending Flow"),
  makeTable(
    ["Step", "Actor", "Action", "System Response"],
    [
      ["1", "Finance Manager", "Fills invoice form on frontend", "Frontend validates fields locally"],
      ["2", "Frontend", "POST /api/fin/invoices with line items", ""],
      ["3", "Invoice Service", "Validate request body (see Section 4.1)", "400 if validation fails"],
      ["4", "Invoice Service", "Fetch customer GSTIN from CRM module via internal API", ""],
      ["5", "Invoice Service", "Determine intra/inter-state based on GSTINs", ""],
      ["6", "Invoice Service", "Calculate GST per line item, build breakdown", ""],
      ["7", "Invoice Service", "Generate invoice number (INV-YYYY-NNNN sequence)", ""],
      ["8", "Invoice Service", "Save to invoices + invoice_line_items tables", ""],
      ["9", "Invoice Service", "Write INVOICE_CREATED to audit_trail", ""],
      ["10", "Invoice Service", "Return 201 with full invoice object", "Frontend navigates to detail page"],
      ["11", "Finance Manager", "Clicks Send Invoice button", ""],
      ["12", "Frontend", "POST /api/fin/invoices/:id/send", ""],
      ["13", "Invoice Service", "Update status: draft -> sent", ""],
      ["14", "Notification Service", "Send invoice PDF email to customer", ""],
      ["15", "Invoice Service", "Write INVOICE_SENT to audit_trail", ""],
    ],
    [600, 1600, 3000, 3826]
  ),
  spacer(),

  h2("5.2 Payment Recording & Reconciliation Flow"),
  makeTable(
    ["Step", "Actor", "Action", "System Response"],
    [
      ["1", "Finance Manager", "Clicks Record Payment on invoice", "Modal opens with invoice details pre-filled"],
      ["2", "Frontend", "POST /api/fin/payments with invoiceId, amount, mode, UTR", ""],
      ["3", "Payment Service", "Validate: invoice exists, status eligible, amount <= outstanding", "422 if business rule violated"],
      ["4", "Payment Service", "Check UTR uniqueness across all payments", "409 if duplicate UTR"],
      ["5", "Payment Service", "Save payment record", ""],
      ["6", "Payment Service", "Update invoice outstanding balance", ""],
      ["7", "Payment Service", "If amount = full balance: update invoice status to PAID", ""],
      ["8", "Payment Service", "If amount < full balance: update invoice status to PARTIAL", ""],
      ["9", "Reconciliation Service", "Auto-match payment UTR against bank entries", ""],
      ["10", "Reconciliation Service", "If match found (confidence > 95%): auto-reconcile, log in audit_trail", ""],
      ["11", "Reconciliation Service", "If match uncertain: add to manual reconciliation queue", ""],
      ["12", "Payment Service", "Generate receipt PDF, store in S3", ""],
      ["13", "Payment Service", "Write PAYMENT_RECORDED to audit_trail", ""],
      ["14", "Payment Service", "Return 201 with payment object", ""],
    ],
    [600, 1800, 3000, 3626]
  ),
  spacer(),

  h2("5.3 Dunning Automation Flow"),
  makeTable(
    ["Step", "Actor", "Action", "System Response"],
    [
      ["1", "Scheduled Job", "Runs every day at 00:00 IST", ""],
      ["2", "Dunning Service", "Query all invoices with status=sent/partial where dueDate < today", ""],
      ["3", "Dunning Service", "For each overdue invoice: update status=overdue", ""],
      ["4", "Dunning Service", "Calculate days overdue for each invoice", ""],
      ["5", "Dunning Service", "Days 1-7: assign L1, send soft reminder email", ""],
      ["6", "Dunning Service", "Days 8-21: escalate to L2, send follow-up email + SMS + CRM task", ""],
      ["7", "Dunning Service", "Days 22-42: escalate to L3, generate and send demand letter PDF", ""],
      ["8", "Dunning Service", "Day 43+: flag for L4 manual escalation, notify finance_head", ""],
      ["9", "Dunning Service", "Write all dunning actions to audit_trail with severity=warning", ""],
      ["10", "Finance Manager", "Can trigger manual reminder anytime via POST /ar/dunning/:id/remind", ""],
    ],
    [600, 1800, 3000, 3626]
  ),
  spacer(),

  h2("5.4 GST Compliance Flow"),
  makeTable(
    ["Step", "Actor", "Action", "System Response"],
    [
      ["1", "Scheduled Job", "Monthly on 1st — prepare GST summary for previous month", ""],
      ["2", "GST Service", "Aggregate all paid invoices for period: sum output GST by rate", ""],
      ["3", "GST Service", "Aggregate all approved vendor bills for period: sum input GST (ITC)", ""],
      ["4", "GST Service", "Compute net_payable = gst_output - itc_utilized", ""],
      ["5", "GST Service", "Create gst_filings record with status=pending", ""],
      ["6", "Finance Manager", "Reviews GST report on dashboard, files return externally", ""],
      ["7", "Finance Manager", "Marks filing as complete via status update", ""],
      ["8", "GST Service", "Update filing_status=filed, set filed_date=today", ""],
      ["9", "Compliance Engine", "Recalculate compliance score (filing accuracy, timeliness, ITC match rate)", ""],
      ["10", "GST Service", "Write GST_RETURN_FILED to audit_trail", ""],
    ],
    [600, 1800, 3000, 3626]
  ),
  spacer(),

  h2("5.5 Expense Approval Flow"),
  makeTable(
    ["Step", "Actor", "Action", "System Response"],
    [
      ["1", "Employee", "Submits expense claim with receipt", ""],
      ["2", "Expense Service", "Validate fields, check receipt requirement by amount", "400/422 if invalid"],
      ["3", "Expense Service", "OCR receipt if uploaded — extract amount for cross-check", "Flag if mismatch > 2%"],
      ["4", "Expense Service", "Determine approval chain based on amount (see Section 2.5)", ""],
      ["5", "Notification Service", "Notify first approver (team lead or manager)", ""],
      ["6", "Manager", "Reviews and approves/rejects via their dashboard", ""],
      ["7", "Expense Service", "If single-level approval: update status=approved", ""],
      ["8", "Expense Service", "If two-level required: escalate to finance_manager", ""],
      ["9", "Finance Manager", "Final approval", "Status=approved"],
      ["10", "Expense Service", "Trigger reimbursement — add to payout queue for accounts", ""],
      ["11", "Expense Service", "Write EXPENSE_APPROVED/REJECTED to audit_trail", ""],
    ],
    [600, 1800, 3000, 3626]
  ),
];

// ─── SECTION 6: AUTH & RBAC ───
const sec6 = [
  h1("6. Authentication & Authorization"),

  h2("6.1 JWT Authentication"),
  bullet("All /api/fin/* endpoints require a valid JWT Bearer token in Authorization header."),
  bullet("Token issued by the central Auth Service (shared across all 20 modules)."),
  bullet("Token payload includes: userId, email, role, branchIds[], permissions[]."),
  bullet("Token expiry: 8 hours for regular users, 1 hour for sensitive roles."),
  bullet("Refresh token: 30 days, single-use, stored in httpOnly cookie."),
  spacer(),

  h2("6.2 Role Permissions Matrix"),
  makeTable(
    ["Action", "finance_manager", "accounts_head", "cfo", "auditor", "employee"],
    [
      ["View dashboards", "Yes", "Yes", "Yes", "Yes", "No"],
      ["Create/edit invoices", "Yes", "No", "No", "No", "No"],
      ["Send invoices", "Yes", "No", "No", "No", "No"],
      ["Record payments", "Yes", "Yes", "No", "No", "No"],
      ["Approve vendor bills", "Yes", "Yes", "No", "No", "No"],
      ["Disburse payouts", "No", "Yes", "No", "No", "No"],
      ["Approve expenses", "Yes (above 25K)", "No", "Yes", "No", "No"],
      ["View GST/TDS reports", "Yes", "Yes", "Yes", "Yes", "No"],
      ["File GST returns", "Yes", "No", "Yes", "No", "No"],
      ["View P&L reports", "Yes", "No", "Yes", "Yes", "No"],
      ["View audit trail", "Yes", "No", "Yes", "Yes", "No"],
      ["Submit expense claims", "No", "No", "No", "No", "Yes"],
    ],
    [2600, 1400, 1400, 1000, 1000, 1626]
  ),
];

// Assemble all sections
const allChildren = [
  ...titlePage,
  ...toc,
  ...sec1,
  ...sec2,
  ...sec3,
  ...sec4,
  ...sec5,
  ...sec6,
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "8B1A1A" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "1a2a4a" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "334155" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "EventHub 360 — Finance & Accounting Module | Backend Architecture v1.0", font: "Arial", size: 16, color: "94a3b8" }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E8E0D8", space: 1 } },
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Page ", font: "Arial", size: 16, color: "94a3b8" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "94a3b8" }),
            new TextRun({ text: " of ", font: "Arial", size: 16, color: "94a3b8" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: "94a3b8" }),
          ],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E8E0D8", space: 1 } },
        })],
      }),
    },
    children: allChildren,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/shivam/Documents/EventManagment-Frontend/docs/EventHub360_FIN_Backend_Architecture_v1.0.docx', buffer);
  console.log('Document created successfully!');
});
