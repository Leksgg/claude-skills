import { Router } from 'express';
import { User } from '../models/User';

const router = Router();
const ROLES = ['customer', 'admin'];

router.get('/users', async (_req, res) => {
  const users = await User.find().select('-passwordHash -resetToken -resetTokenExpires');
  res.json(users);
});

router.post('/users/:id/role', async (req, res) => {
  const role = String(req.body.role);
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rol no válido' });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ id: user.id, role: user.role });
});

export default router;
