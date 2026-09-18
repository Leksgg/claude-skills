import { apiClient } from '../../lib/api';
import type { Order } from '../../types';

export function getOrders(): Promise<Order[]> {
  return apiClient.get<Order[]>('/orders');
}

export function getOrder(id: string): Promise<Order> {
  return apiClient.get<Order>(`/orders/${id}`);
}

export function deleteOrder(id: string): Promise<void> {
  return apiClient.delete(`/orders/${id}`);
}
