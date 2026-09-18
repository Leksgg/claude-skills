import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const provided = Buffer.from(String(req.headers['x-admin-key'] ?? ''));
  const expected = Buffer.from(config.adminApiKey);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return res.status(403).json({ error: 'Prohibido' });
  }
  next();
}
