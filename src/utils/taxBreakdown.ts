export const TAX_TRANSPARENCY_LABEL =
  "Régimen de Transparencia Fiscal al Consumidor (Ley 27.743)";

export type TaxBreakdown = {
  vatRate: number;
  subtotalWithoutTax: number;
  vatAmount: number;
  subtotalWithTax: number;
  taxTransparencyLabel: string;
};

export const round2 = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const formatVatRate = (value?: number) => {
  const n = Number(value ?? 21);
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
};

export function computeTaxBreakdownFromSubtotalWithTax(
  subtotalWithTaxValue: number,
  vatRateValue = 21,
): TaxBreakdown {
  const vatRate = Number.isFinite(Number(vatRateValue)) ? Number(vatRateValue) : 21;
  const rate = vatRate / 100;
  const subtotalWithTax = round2(Number(subtotalWithTaxValue || 0));
  const subtotalWithoutTax =
    rate > 0 ? round2(subtotalWithTax / (1 + rate)) : subtotalWithTax;

  return {
    vatRate,
    subtotalWithoutTax,
    vatAmount: round2(subtotalWithTax - subtotalWithoutTax),
    subtotalWithTax,
    taxTransparencyLabel: TAX_TRANSPARENCY_LABEL,
  };
}

export function computeTaxBreakdownFromSubtotalWithoutTax(
  subtotalWithoutTaxValue: number,
  vatRateValue = 21,
): TaxBreakdown {
  const vatRate = Number.isFinite(Number(vatRateValue)) ? Number(vatRateValue) : 21;
  const subtotalWithoutTax = round2(Number(subtotalWithoutTaxValue || 0));
  const subtotalWithTax = round2(subtotalWithoutTax * (1 + vatRate / 100));

  return {
    vatRate,
    subtotalWithoutTax,
    vatAmount: round2(subtotalWithTax - subtotalWithoutTax),
    subtotalWithTax,
    taxTransparencyLabel: TAX_TRANSPARENCY_LABEL,
  };
}

export function normalizeOrderTaxBreakdown(
  order: Partial<TaxBreakdown> & { subtotal?: number },
  fallbackSubtotalWithTax: number,
  fallbackVatRate = 21,
) {
  const subtotalWithoutTax = Number(order.subtotalWithoutTax);
  const vatAmount = Number(order.vatAmount);
  const subtotalWithTax = Number(order.subtotalWithTax);
  const vatRate = Number.isFinite(Number(order.vatRate))
    ? Number(order.vatRate)
    : fallbackVatRate;

  if (
    Number.isFinite(subtotalWithoutTax) &&
    Number.isFinite(vatAmount) &&
    Number.isFinite(subtotalWithTax)
  ) {
    return {
      vatRate,
      subtotalWithoutTax: round2(subtotalWithoutTax),
      vatAmount: round2(vatAmount),
      subtotalWithTax: round2(subtotalWithTax),
      taxTransparencyLabel: order.taxTransparencyLabel || TAX_TRANSPARENCY_LABEL,
    };
  }

  return computeTaxBreakdownFromSubtotalWithTax(fallbackSubtotalWithTax, vatRate);
}
