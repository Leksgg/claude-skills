import path from 'node:path';
import { Router } from 'express';
import { config } from '../config';

const router = Router();

router.get('/download', (req, res) => {
  const file = path.join(config.uploadDir, String(req.query.name ?? ''));
  res.sendFile(file);
});

router.get('/avatars/:name', (req, res) => {
  const base = path.resolve(config.avatarDir);
  const file = path.resolve(base, path.basename(req.params.name));
  if (!file.startsWith(base + path.sep)) return res.status(400).end();
  res.sendFile(file);
});

export default router;
