/**
 * Utilidades para manejo de precios según legislación comercial argentina
 * 
 * Reglas:
 * - Todos los precios base vienen SIN IVA desde backend
 * - El precio mostrado al usuario debe ser SIEMPRE con IVA (21%)
 * - Formato: pesos argentinos con miles separados por punto y decimales por coma
 * - Ejemplo: $15.000,00
 */

const IVA_RATE = 0.21; // 21% IVA Argentina

/**
 * Formatea un valor numérico a formato de pesos argentinos (ARS)
 * Ejemplo: 15000 -> "$15.000,00"
 */
export function formatPrecioARS(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Calcula el precio final con IVA incluido (21%)
 * @param precioBase - Precio sin impuestos
 * @returns Precio final con IVA
 */
export function getPrecioFinalConIVA(precioBase: number): number {
  return precioBase * (1 + IVA_RATE);
}

/**
 * Calcula el precio base (sin IVA) desde un precio final
 * @param precioFinal - Precio con IVA incluido
 * @returns Precio sin impuestos
 */
export function getPrecioSinImpuestosDesdeFinal(precioFinal: number): number {
  return precioFinal / (1 + IVA_RATE);
}

/**
 * Formatea y muestra precio final con IVA
 * Utility function que combina cálculo y formateo
 */
export function formatPrecioFinalConIVA(precioBase: number): string {
  return formatPrecioARS(getPrecioFinalConIVA(precioBase));
}

/**
 * Verifica si un producto está en oferta
 */
export function estaEnOferta(originalPrice?: number): boolean {
  return originalPrice !== undefined && originalPrice > 0;
}
