import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { verifyJwt, TokenPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Mungon tokeni i autentifikimit' });
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyJwt(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Tokeni është i pavlefshëm ose ka skaduar' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Mungon autentifikimi' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nuk ke akses për këtë veprim' });
    }
    next();
  };
}
