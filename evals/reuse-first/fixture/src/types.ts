export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customer: string;
  createdAt: Date;
  status: 'pending' | 'paid' | 'shipped';
  lines: OrderLine[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
