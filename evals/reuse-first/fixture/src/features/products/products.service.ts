import { apiClient } from '../../lib/api';
import type { Product } from '../../types';

export function getProducts(): Promise<Product[]> {
  return apiClient.get<Product[]>('/products');
}

export function getProduct(id: string): Promise<Product> {
  return apiClient.get<Product>(`/products/${id}`);
}
