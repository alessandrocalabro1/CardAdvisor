import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter for standard user read/write operations.
 * Allows max 300 requests per 15-minute window per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

/**
 * Strict rate limiter for administrative and expensive calculation endpoints.
 * Allows max 30 requests per 15-minute window per IP.
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
