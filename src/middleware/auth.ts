import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

// ─── Auth Middleware (System User Stub) ───────────────────────────────────────
// Uses the system user for all operations until JWT auth is added in a future phase.
// Replace this middleware with JWT verification when auth is implemented.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

let cachedSystemUserId: number | null = null;

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (cachedSystemUserId) {
      req.userId = cachedSystemUserId;
      return next();
    }
    const systemUser = await prisma.user.findFirstOrThrow({
      where: { email: 'system@ricemate.local' },
      select: { id: true },
    });
    cachedSystemUserId = systemUser.id;
    req.userId = systemUser.id;
    next();
  } catch (err: any) {
    console.error('requireAuth error:', err?.message || err);
    res.status(500).json({ success: false, message: 'System user lookup error. Check database connectivity.' });
  }
}
