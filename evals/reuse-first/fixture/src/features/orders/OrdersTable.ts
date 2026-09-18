import { escapeHtml } from '../../lib/html';
import type { Order } from '../../types';

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
};

export function renderOrdersTable(orders: Order[]): string {
  const rows = orders
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.id)}</td>
        <td>${escapeHtml(order.customer)}</td>
        <td>${STATUS_LABELS[order.status]}</td>
      </tr>`,
    )
    .join('');

  return `
    <table class="orders">
      <thead>
        <tr><th>Pedido</th><th>Cliente</th><th>Estado</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
