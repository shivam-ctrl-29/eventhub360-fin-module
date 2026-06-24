export type ExpenseCategory = 'food_beverage' | 'logistics' | 'travel' | 'marketing' | 'venue' | 'decor' | 'miscellaneous'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed'

export interface Expense {
  id: string
  employeeName: string
  employeeId: string
  category: ExpenseCategory
  description: string
  amount: number
  receiptUrl?: string
  submittedDate: string
  status: ExpenseStatus
  approvedBy?: string
  approvedDate?: string
  remarks?: string
}

export interface ExpenseBudget {
  category: ExpenseCategory
  budgeted: number
  actual: number
  variance: number
  variancePercent: number
}

export interface VendorBill {
  id: string
  billNumber: string
  vendorId: string
  vendorName: string
  amount: number
  gstAmount: number
  totalAmount: number
  billDate: string
  dueDate: string
  status: 'pending' | 'approved' | 'paid' | 'overdue'
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
}

export interface PayoutScheduleItem {
  id: string
  vendorId: string
  vendorName: string
  billId: string
  amount: number
  scheduledDate: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'disbursed'
  approvedBy?: string
}
