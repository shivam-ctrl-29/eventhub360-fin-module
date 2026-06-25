import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GSTCalculationResult,
  GSTBreakdownByRate,
  LineItemCalculation,
} from '../../../common/interfaces';

interface LineItemInput {
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

@Injectable()
export class GSTCalculationEngine {
  private readonly companyStateCode: string;

  constructor(private readonly configService: ConfigService) {
    this.companyStateCode = this.configService.get<string>(
      'company.stateCode',
      '27',
    );
  }

  /**
   * Determines if a transaction is inter-state based on GSTIN prefixes.
   * GSTIN format: [2-digit state code][10-digit PAN][...]
   */
  isInterState(customerGstin: string | null | undefined): boolean {
    if (!customerGstin || customerGstin.length < 2) {
      return false;
    }
    const customerStateCode = customerGstin.substring(0, 2);
    return customerStateCode !== this.companyStateCode;
  }

  /**
   * Calculate GST amounts for a single line item.
   * Intra-state: CGST + SGST (equal split)
   * Inter-state: IGST only
   */
  calculateLineItem(
    item: LineItemInput,
    interState: boolean,
  ): LineItemCalculation {
    const taxableAmt = this.round(item.quantity * item.unitPrice);
    const totalGstAmount = this.round(taxableAmt * (item.gstRate / 100));

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (interState) {
      igst = totalGstAmount;
    } else {
      cgst = this.round(totalGstAmount / 2);
      sgst = this.round(totalGstAmount - cgst); // handle odd paise
    }

    const gstAmount = cgst + sgst + igst;
    const total = this.round(taxableAmt + gstAmount);

    return { taxableAmt, cgst, sgst, igst, gstAmount, total };
  }

  /**
   * Calculate totals for all line items and build GST breakdown by rate.
   */
  calculateInvoiceTotals(
    lineItems: LineItemInput[],
    interState: boolean,
  ): {
    lineCalculations: LineItemCalculation[];
    subtotal: number;
    totalGst: number;
    grandTotal: number;
    gstBreakdown: GSTBreakdownByRate[];
  } {
    const lineCalculations = lineItems.map((item) =>
      this.calculateLineItem(item, interState),
    );

    const subtotal = this.round(
      lineCalculations.reduce((sum, lc) => sum + lc.taxableAmt, 0),
    );
    const totalGst = this.round(
      lineCalculations.reduce((sum, lc) => sum + lc.gstAmount, 0),
    );
    const grandTotal = this.round(subtotal + totalGst);

    const gstBreakdown = this.buildGSTBreakdown(lineItems, lineCalculations);

    return { lineCalculations, subtotal, totalGst, grandTotal, gstBreakdown };
  }

  /**
   * Build GST breakdown grouped by rate for invoice detail view.
   */
  buildGSTBreakdown(
    lineItems: LineItemInput[],
    calculations: LineItemCalculation[],
  ): GSTBreakdownByRate[] {
    const breakdownMap = new Map<number, GSTBreakdownByRate>();

    lineItems.forEach((item, idx) => {
      const calc = calculations[idx];
      const existing = breakdownMap.get(item.gstRate);

      if (existing) {
        existing.taxableAmount = this.round(
          existing.taxableAmount + calc.taxableAmt,
        );
        existing.cgst = this.round(existing.cgst + calc.cgst);
        existing.sgst = this.round(existing.sgst + calc.sgst);
        existing.igst = this.round(existing.igst + calc.igst);
        existing.total = this.round(
          existing.total + calc.gstAmount,
        );
      } else {
        breakdownMap.set(item.gstRate, {
          rate: item.gstRate,
          taxableAmount: calc.taxableAmt,
          cgst: calc.cgst,
          sgst: calc.sgst,
          igst: calc.igst,
          total: calc.gstAmount,
        });
      }
    });

    return Array.from(breakdownMap.values()).sort((a, b) => a.rate - b.rate);
  }

  /**
   * Calculate GST for a single amount at a given rate.
   */
  calculateGSTOnAmount(
    amount: number,
    gstRate: number,
    interState: boolean,
  ): GSTCalculationResult {
    const taxableAmount = amount;
    const totalGstAmount = this.round(amount * (gstRate / 100));

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (interState) {
      igst = totalGstAmount;
    } else {
      cgst = this.round(totalGstAmount / 2);
      sgst = this.round(totalGstAmount - cgst);
    }

    return {
      taxableAmount,
      cgst,
      sgst,
      igst,
      gstAmount: totalGstAmount,
      total: this.round(taxableAmount + totalGstAmount),
    };
  }

  /**
   * Calculate TDS amount based on section and rate.
   */
  calculateTDS(grossAmount: number, tdsRate: number): number {
    return this.round(grossAmount * (tdsRate / 100));
  }

  /**
   * Compute GST compliance score from filing history.
   */
  computeComplianceScore(params: {
    totalFilings: number;
    onTimeFilings: number;
    itcMatchRate: number;
    filingAccuracy: number;
  }): {
    score: number;
    grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    filingAccuracy: number;
    timelinessRate: number;
    itcMatchRate: number;
  } {
    const timelinessRate =
      params.totalFilings > 0
        ? (params.onTimeFilings / params.totalFilings) * 100
        : 0;

    const score = Math.round(
      timelinessRate * 0.4 +
        params.filingAccuracy * 0.35 +
        params.itcMatchRate * 0.25,
    );

    let grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    if (score >= 90) grade = 'EXCELLENT';
    else if (score >= 75) grade = 'GOOD';
    else if (score >= 60) grade = 'FAIR';
    else grade = 'POOR';

    return {
      score,
      grade,
      filingAccuracy: Math.round(params.filingAccuracy),
      timelinessRate: Math.round(timelinessRate),
      itcMatchRate: Math.round(params.itcMatchRate),
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}