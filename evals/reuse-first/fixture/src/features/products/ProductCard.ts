import { formatPriceOld } from '../../lib/format';
import { escapeHtml } from '../../lib/html';
import type { Product } from '../../types';

export function renderProductCard(product: Product): string {
  const stockLabel = product.stock > 0 ? `${product.stock} en stock` : 'Agotado';

  return `
    <div class="product-card">
      <h3>${escapeHtml(product.name)}</h3>
      <p class="price">${formatPriceOld(product.price)}</p>
      <p class="stock">${stockLabel}</p>
    </div>`;
}
