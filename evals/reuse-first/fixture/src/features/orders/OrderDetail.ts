import { formatCurrency } from '../../lib/format';
import { escapeHtml } from '../../lib/html';
import type { Order } from '../../types';

export function renderOrderDetail(order: Order): string {
  const lines = order.lines
    .map((line) => `<li>${line.quantity} × ${escapeHtml(line.productId)} — ${formatCurrency(line.unitPrice)}</li>`)
    .join('');

  return `
    <article class="order-detail">
      <h2>Pedido ${escapeHtml(order.id)}</h2>
      <p>Cliente: ${escapeHtml(order.customer)}</p>
      <p>Creado: ${order.createdAt.toISOString()}</p>
      <ul>${lines}</ul>
    </article>`;
}
