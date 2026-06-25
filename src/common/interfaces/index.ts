export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: PaginationMeta;
    errors?: ValidationError[];
  }
  
  export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  
  export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  export interface ValidationError {
    field: string;
    message: string;
    value?: unknown;
  }
  
  export interface JwtPayload {
    sub: string;
    email: string;
    roles: string[];
    companyId?: string;
    branchId?: string;
    iat?: number;
    exp?: number;
  }
  
  export interface RequestWithUser extends Request {
    user: JwtPayload;
  }
  
  export interface GSTCalculationResult {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstAmount: number;
    total: number;
  }
  
  export interface LineItemCalculation {
    taxableAmt: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstAmount: number;
    total: number;
  }
  
  export interface GSTBreakdownByRate {
    rate: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  }
  
  export interface DunningContext {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    daysOverdue: number;
    amountDue: number;
    grandTotal: number;
  }
  
  export interface ReconciliationMatchResult {
    confidence: number;
    matchType: 'utr_exact' | 'amount_date_proximity' | 'no_match';
    suggestedInvoiceId?: string;
    suggestedInvoiceNumber?: string;
  }
  
  export interface AuditContext {
    userId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }