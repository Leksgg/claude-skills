import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthUser {
  id: string;
  role: 'customer' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    req.user = { id: String(payload.sub), role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Token no válido' });
  }
}

export function signToken(user: { id: string; role: string }): string {
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: '1h',
  });
}
