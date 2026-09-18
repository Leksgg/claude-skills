import { formatCurrency } from '../../lib/format';
import { calculateOrderTotal, calculateTax } from '../../lib/totals';
import type { OrderLine } from '../../types';

export function renderCheckoutSummary(lines: OrderLine[]): string {
  const subtotal = calculateOrderTotal(lines);
  const tax = calculateTax(subtotal);

  return `
    <aside class="checkout-summary">
      <p>Subtotal: ${formatCurrency(subtotal)}</p>
      <p>IVA: ${formatCurrency(tax)}</p>
      <p><strong>Total: ${formatCurrency(subtotal + tax)}</strong></p>
    </aside>`;
}
