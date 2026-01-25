/**
 * Utilidades para manejo de precios
 *
 * Reglas:
 * - Todos los precios base vienen SIN IVA desde backend
 * - El precio mostrado al usuario debe ser SIEMPRE con IVA (configurable)
 * - Formato: pesos argentinos con miles separados por punto y decimales por coma
 * - Ejemplo: $15.000,00
 */

// Defaults seguros si settings aún no cargó
const DEFAULT_IVA_PCT = 21; // % (Argentina)

export function formatPrecioARS(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Convierte % a factor (ej 21 -> 0.21)
 */
export function pctToRate(pct?: number): number {
  const n = Number(pct);
  if (!Number.isFinite(n)) return DEFAULT_IVA_PCT / 100;
  return n / 100;
}

/**
 * Calcula el precio final con IVA incluido.
 * @param precioBase - Precio sin impuestos
 * @param ivaPct - IVA en porcentaje (ej: 21)
 */
export function getPrecioFinalConIVA(
  precioBase: number,
  ivaPct: number = DEFAULT_IVA_PCT,
): number {
  const rate = pctToRate(ivaPct);
  return Number(precioBase || 0) * (1 + rate);
}

/**
 * Calcula el precio base (sin IVA) desde un precio final
 * @param precioFinal - Precio con IVA incluido
 * @param ivaPct - IVA en porcentaje (ej: 21)
 */
export function getPrecioSinImpuestosDesdeFinal(
  precioFinal: number,
  ivaPct: number = DEFAULT_IVA_PCT,
): number {
  const rate = pctToRate(ivaPct);
  return Number(precioFinal || 0) / (1 + rate);
}

/**
 * Formatea y muestra precio final con IVA
 */
export function formatPrecioFinalConIVA(
  precioBase: number,
  ivaPct: number = DEFAULT_IVA_PCT,
): string {
  return formatPrecioARS(getPrecioFinalConIVA(precioBase, ivaPct));
}

export function estaEnOferta(originalPrice?: number): boolean {
  return originalPrice !== undefined && originalPrice > 0;
}
