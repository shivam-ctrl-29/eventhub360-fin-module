import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding Finance Module database...');

  // Numbering Sequences
  await prisma.numberingSequence.upsert({
    where: { entity: 'invoice' },
    update: {},
    create: { entity: 'invoice', prefix: 'INV', nextNo: 1001n },
  });
  await prisma.numberingSequence.upsert({
    where: { entity: 'payment' },
    update: {},
    create: { entity: 'payment', prefix: 'PAY', nextNo: 1001n },
  });
  await prisma.numberingSequence.upsert({
    where: { entity: 'credit_note' },
    update: {},
    create: { entity: 'credit_note', prefix: 'CN', nextNo: 1001n },
  });
  await prisma.numberingSequence.upsert({
    where: { entity: 'debit_note' },
    update: {},
    create: { entity: 'debit_note', prefix: 'DN', nextNo: 1001n },
  });

  // Seed Customers
  const customer1 = await prisma.customer.upsert({
    where: { customerCode: 'CUST-001' },
    update: {},
    create: {
      customerCode: 'CUST-001',
      name: 'Sharma Weddings Pvt Ltd',
      email: 'accounts@sharmaWeddings.com',
      phone: '9876543210',
      gstin: '27AABCS9603R1ZX',
      pan: 'AABCS9603R',
      billingAddress: '12, MG Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      creditLimit: 500000,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { customerCode: 'CUST-002' },
    update: {},
    create: {
      customerCode: 'CUST-002',
      name: 'TechCorp India Ltd',
      email: 'finance@techcorp.in',
      phone: '9123456780',
      gstin: '27AATCS1234R1ZY',
      pan: 'AATCS1234R',
      billingAddress: '45, BKC, Bandra East',
      city: 'Mumbai',
      state: 'Maharashtra',
      creditLimit: 1000000,
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { customerCode: 'CUST-003' },
    update: {},
    create: {
      customerCode: 'CUST-003',
      name: 'Royal Events Delhi',
      email: 'billing@royalevents.in',
      phone: '9988776655',
      gstin: '07ABERS1234R1ZP',
      pan: 'ABERS1234R',
      billingAddress: '78, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      creditLimit: 750000,
    },
  });

  // Seed Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN-001' },
    update: {},
    create: {
      vendorCode: 'VEN-001',
      name: 'Decorators Paradise',
      email: 'payments@decoratorsparadise.com',
      phone: '9001234567',
      gstin: '27AADCD1234R1ZZ',
      pan: 'AADCD1234R',
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { vendorCode: 'VEN-002' },
    update: {},
    create: {
      vendorCode: 'VEN-002',
      name: 'Mumbai Caterers Co.',
      email: 'billing@mumbaicaterers.com',
      phone: '9112345678',
      gstin: '27AABMC5678R1ZX',
      pan: 'AABMC5678R',
      bankName: 'ICICI Bank',
      accountNumber: '012345678901',
      ifscCode: 'ICIC0000123',
    },
  });

  // Seed draft invoice
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-1001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-1001',
      customerId: customer1.id,
      status: 'draft',
      issueDate: new Date('2026-06-01'),
      dueDate: new Date('2026-06-30'),
      subtotal: 100000,
      totalGst: 18000,
      grandTotal: 118000,
      amountPaid: 0,
      amountDue: 118000,
      isInterState: false,
      notes: 'Wedding event services — June 2026',
      lineItems: {
        create: [
          {
            description: 'Premium Venue Decoration — Grand Ballroom',
            quantity: 1,
            unitPrice: 75000,
            gstRate: 18,
            taxableAmt: 75000,
            cgst: 6750,
            sgst: 6750,
            igst: 0,
            gstAmount: 13500,
            total: 88500,
            sortOrder: 0,
          },
          {
            description: 'Photography & Videography Package',
            quantity: 1,
            unitPrice: 25000,
            gstRate: 18,
            taxableAmt: 25000,
            cgst: 2250,
            sgst: 2250,
            igst: 0,
            gstAmount: 4500,
            total: 29500,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // Seed paid invoice
  const paidInvoice = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-1002' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-1002',
      customerId: customer2.id,
      status: 'paid',
      issueDate: new Date('2026-05-01'),
      dueDate: new Date('2026-05-31'),
      subtotal: 200000,
      totalGst: 36000,
      grandTotal: 236000,
      amountPaid: 236000,
      amountDue: 0,
      isInterState: false,
      notes: 'Corporate event — Q1 summit',
      lineItems: {
        create: [
          {
            description: 'Corporate Conference Hall — 2 Days',
            quantity: 2,
            unitPrice: 80000,
            gstRate: 18,
            taxableAmt: 160000,
            cgst: 14400,
            sgst: 14400,
            igst: 0,
            gstAmount: 28800,
            total: 188800,
            sortOrder: 0,
          },
          {
            description: 'Catering — Lunch & Dinner for 200 pax',
            quantity: 1,
            unitPrice: 40000,
            gstRate: 18,
            taxableAmt: 40000,
            cgst: 3600,
            sgst: 3600,
            igst: 0,
            gstAmount: 7200,
            total: 47200,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  // Seed payment for paid invoice
  await prisma.payment.upsert({
    where: { paymentNumber: 'PAY-2026-1001' },
    update: {},
    create: {
      paymentNumber: 'PAY-2026-1001',
      invoiceId: paidInvoice.id,
      amount: 236000,
      paymentMode: 'bank_transfer',
      utrNumber: 'UTR2026060112345',
      bankName: 'HDFC Bank',
      status: 'settled',
      paymentDate: new Date('2026-05-28'),
      remarks: 'Full payment received via NEFT',
    },
  });

  // Seed overdue invoice (inter-state)
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-1003' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-1003',
      customerId: customer3.id,
      status: 'overdue',
      issueDate: new Date('2026-04-15'),
      dueDate: new Date('2026-05-15'),
      subtotal: 150000,
      totalGst: 27000,
      grandTotal: 177000,
      amountPaid: 0,
      amountDue: 177000,
      isInterState: true,
      notes: 'Delhi wedding event services',
      lineItems: {
        create: [
          {
            description: 'Event Management Services — 3 Days',
            quantity: 3,
            unitPrice: 50000,
            gstRate: 18,
            taxableAmt: 150000,
            cgst: 0,
            sgst: 0,
            igst: 27000,
            gstAmount: 27000,
            total: 177000,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  // Seed vendor bills
  await prisma.vendorBill.upsert({
    where: { id: 'vb-seed-001-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'vb-seed-001-0000-0000-000000000001',
      billNumber: 'BILL-2026-001',
      vendorId: vendor1.id,
      amount: 50000,
      gstAmount: 9000,
      totalAmount: 59000,
      billDate: new Date('2026-06-01'),
      dueDate: new Date('2026-06-20'),
      status: 'pending',
      priority: 'high',
      category: 'Decoration',
    },
  });

  await prisma.vendorBill.upsert({
    where: { id: 'vb-seed-002-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'vb-seed-002-0000-0000-000000000002',
      billNumber: 'BILL-2026-002',
      vendorId: vendor2.id,
      amount: 80000,
      gstAmount: 14400,
      totalAmount: 94400,
      billDate: new Date('2026-05-20'),
      dueDate: new Date('2026-06-10'),
      status: 'approved',
      priority: 'critical',
      category: 'Catering',
    },
  });

  // Seed expenses
  await prisma.expense.createMany({
    skipDuplicates: true,
    data: [
      {
        employeeId: '00000000-0000-0000-0000-000000000001',
        category: 'travel',
        description: 'Client site visit — Sharma Weddings venue inspection',
        amount: 3500,
        submittedDate: new Date('2026-06-10'),
        status: 'pending',
      },
      {
        employeeId: '00000000-0000-0000-0000-000000000002',
        category: 'food_beverage',
        description: 'Team lunch during TechCorp event setup',
        amount: 1200,
        submittedDate: new Date('2026-06-12'),
        status: 'approved',
        approvedDate: new Date('2026-06-13'),
      },
      {
        employeeId: '00000000-0000-0000-0000-000000000001',
        category: 'marketing',
        description: 'Social media ads for upcoming event promotions',
        amount: 15000,
        submittedDate: new Date('2026-06-08'),
        status: 'pending',
      },
    ],
  });

  // Seed expense budgets
  await prisma.expenseBudget.createMany({
    skipDuplicates: true,
    data: [
      { category: 'food_beverage', month: 6, year: 2026, budgeted: 20000 },
      { category: 'logistics', month: 6, year: 2026, budgeted: 30000 },
      { category: 'travel', month: 6, year: 2026, budgeted: 25000 },
      { category: 'marketing', month: 6, year: 2026, budgeted: 50000 },
      { category: 'venue', month: 6, year: 2026, budgeted: 100000 },
      { category: 'decor', month: 6, year: 2026, budgeted: 80000 },
      { category: 'miscellaneous', month: 6, year: 2026, budgeted: 10000 },
    ],
  });

  // Seed GST filing
  const existingGST = await prisma.gSTFiling.findFirst({
    where: {
      branchId: null,
      period: '2026-05',
      returnType: 'GSTR3B',
    },
  });
  
  if (!existingGST) {
    await prisma.gSTFiling.create({
      data: {
        branchId: null,
        period: '2026-05',
        returnType: 'GSTR3B',
        gstOutput: 63000,
        gstInput: 23400,
        itcAvailable: 23400,
        itcUtilized: 23400,
        netPayable: 39600,
        filingStatus: 'filed',
        filedDate: new Date('2026-06-20'),
        dueDate: new Date('2026-06-20'),
      },
    });
  }
  // Seed bank reconciliation entries
  await prisma.bankReconciliationEntry.upsert({
    where: { utrNumber: 'UTR2026060112345' },
    update: {},
    create: {
      bankDescription: 'NEFT CR-TECHCORP INDIA LTD UTR2026060112345',
      utrNumber: 'UTR2026060112345',
      amount: 236000,
      transactionDate: new Date('2026-05-28'),
      isReconciled: true,
      reconciledAt: new Date('2026-05-28T10:30:00Z'),
    },
  });

  await prisma.bankReconciliationEntry.upsert({
    where: { utrNumber: 'UTR2026062100001' },
    update: {},
    create: {
      bankDescription: 'IMPS CR-UNKNOWN CUSTOMER UTR2026062100001',
      utrNumber: 'UTR2026062100001',
      amount: 50000,
      transactionDate: new Date('2026-06-21'),
      isReconciled: false,
    },
  });

  console.log('✅ Finance Module seed data inserted successfully.');
  console.log(`   Customers: 3 | Vendors: 2 | Invoices: 3 | Payments: 1`);
  console.log(`   Vendor Bills: 2 | Expenses: 3 | GST Filings: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });