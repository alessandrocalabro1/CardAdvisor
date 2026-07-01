import { Request, Response, NextFunction } from 'express';

/**
 * Middleware protecting admin endpoints with a pre-shared API token.
 * Production requires the token to be set. Development prints a warning if missing.
 */
export function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  const token = process.env.ADMIN_API_TOKEN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!token) {
    if (isProduction) {
      console.error('[Security] ADMIN_API_TOKEN is missing in production environment!');
      return res.status(500).json({ error: 'Admin token is not configured.' });
    } else {
      console.warn('[Security] ADMIN_API_TOKEN is not configured in development mode. Allowing operation.');
      return next();
    }
  }

  const clientToken = req.headers['x-admin-token'];

  if (!clientToken || clientToken !== token) {
    console.warn(`[Security] Unauthorized admin operation attempted from IP ${req.ip}`);
    return res.status(403).json({ error: 'Unauthorized admin operation.' });
  }

  next();
}
