import { Router } from 'express';
import { Order } from '../models/Order';

const router = Router();

interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

router.get('/', async (req, res) => {
  const orders = await Order.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(order);
});

router.post('/', async (req, res) => {
  const items = (req.body.items ?? []) as OrderItemInput[];
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El pedido está vacío' });
  }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = await Order.create({
    userId: req.user!.id,
    items,
    total,
    shippingAddress: String(req.body.shippingAddress ?? ''),
  });
  res.status(201).json(order);
});

router.delete('/:id', async (req, res) => {
  const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user!.id, status: 'pending' });
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.status(204).end();
});

export default router;
