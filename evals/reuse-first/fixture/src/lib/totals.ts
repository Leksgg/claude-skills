import type { OrderLine } from '../types';

export function calculateOrderTotal(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function calculateTax(amount: number, rate = 0.21): number {
  return Math.round(amount * rate * 100) / 100;
}
