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

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const systemUser = await prisma.user.findFirstOrThrow({
      where: { email: 'system@ricemate.local' },
      select: { id: true },
    });
    req.userId = systemUser.id;
    next();
  } catch {
    res.status(500).json({ success: false, message: 'System user not found. Run the seed script.' });
  }
}
