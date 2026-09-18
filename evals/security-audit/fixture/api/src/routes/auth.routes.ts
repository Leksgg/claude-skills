import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { signToken } from '../middleware/auth';
import { User } from '../models/User';
import { sendResetEmail } from '../services/mailer';

const router = Router();

router.post('/login', async (req, res) => {
  const email = String(req.body.email ?? '').toLowerCase();
  const user = await User.findOne({ email });
  const valid = user && (await bcrypt.compare(String(req.body.password ?? ''), user.passwordHash));
  if (!user || !valid) {
    return res.status(401).json({ error: 'Credenciales no válidas' });
  }
  res.json({ token: signToken({ id: user.id, role: user.role }) });
});

router.post('/forgot', async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email ?? '').toLowerCase() });
  if (user) {
    user.resetToken = randomBytes(32).toString('hex');
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendResetEmail(user.email, user.resetToken);
  }
  res.json({ ok: true });
});

router.post('/reset', async (req, res) => {
  const user = await User.findOne({
    resetToken: req.body.token,
    resetTokenExpires: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ error: 'Token no válido o caducado' });

  user.passwordHash = await bcrypt.hash(String(req.body.password), 12);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ ok: true });
});

export default router;
