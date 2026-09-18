const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** Formatea un importe con el locale de la tienda (es-ES). */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/**
 * @deprecated Usa formatCurrency. Ignora el locale y la moneda.
 */
export function formatPriceOld(price: number): string {
  return price.toFixed(2) + ' €';
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}
