import type { GSTRate, GSTBreakdown } from '../types/invoice.types'

export interface LineItemGST {
  taxableAmount: number
  gstAmount: number
  total: number
}

export function calculateLineItemGST(unitPrice: number, quantity: number, gstRate: GSTRate): LineItemGST {
  const taxableAmount = unitPrice * quantity
  const gstAmount = (taxableAmount * gstRate) / 100
  return {
    taxableAmount,
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    total: parseFloat((taxableAmount + gstAmount).toFixed(2)),
  }
}

// Intra-state: CGST + SGST (split equally). Inter-state: IGST only.
export function splitGST(
  gstAmount: number,
  isInterState = false
): { cgst: number; sgst: number; igst: number } {
  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: gstAmount }
  }
  const half = parseFloat((gstAmount / 2).toFixed(2))
  return { cgst: half, sgst: half, igst: 0 }
}

export function buildGSTBreakdown(
  lineItems: Array<{ quantity: number; unitPrice: number; gstRate: GSTRate }>,
  isInterState = false
): GSTBreakdown[] {
  const map = new Map<GSTRate, { taxable: number; gst: number }>()

  for (const item of lineItems) {
    const { taxableAmount, gstAmount } = calculateLineItemGST(item.unitPrice, item.quantity, item.gstRate)
    const prev = map.get(item.gstRate) ?? { taxable: 0, gst: 0 }
    map.set(item.gstRate, { taxable: prev.taxable + taxableAmount, gst: prev.gst + gstAmount })
  }

  return Array.from(map.entries()).map(([rate, { taxable, gst }]) => {
    const { cgst, sgst, igst } = splitGST(gst, isInterState)
    return { rate, taxableAmount: taxable, cgst, sgst, igst }
  })
}
