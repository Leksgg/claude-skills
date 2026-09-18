import { Router } from 'express';
import { User } from '../models/User';

const router = Router();
const PRIVATE_FIELDS = '-passwordHash -resetToken -resetTokenExpires';

router.get('/me', async (req, res) => {
  const user = await User.findById(req.user!.id).select(PRIVATE_FIELDS);
  res.json(user);
});

router.patch('/me', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user!.id, req.body, { new: true }).select(PRIVATE_FIELDS);
  res.json(user);
});

export default router;
