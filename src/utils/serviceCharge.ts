export type ServiceChargeRule = {
  min: number;
  max: number;
  fee: number;
};

function formatAmount(value: number) {
  return Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function findServiceChargeRule(
  subtotal: number,
  rules: ServiceChargeRule[] = [],
) {
  return (
    [...rules]
      .sort((a, b) => Number(a.min) - Number(b.min))
      .find(
        (rule) =>
          subtotal >= Number(rule.min) && subtotal <= Number(rule.max),
      ) || null
  );
}

export function formatServiceChargeRuleLabel(rule: ServiceChargeRule | null) {
  if (!rule) return "Cargo por servicio";

  const min = Number(rule.min);
  const max = Number(rule.max);
  const fee = Number(rule.fee);
  const feeLabel = `$${formatAmount(fee)}`;

  if (min === 0) {
    return `Compras hasta $${formatAmount(max)} - cargo ${feeLabel}`;
  }

  if (max >= 999000) {
    return `Compras mayores a $${formatAmount(min - 1)} - cargo ${feeLabel}`;
  }

  return `Compras entre $${formatAmount(min)} y $${formatAmount(max)} - cargo ${feeLabel}`;
}

export function formatServiceChargeDisplayLabel(rule: ServiceChargeRule | null) {
  const label = formatServiceChargeRuleLabel(rule);
  return label === "Cargo por servicio" ? label : `Cargo por servicio (${label})`;
}
