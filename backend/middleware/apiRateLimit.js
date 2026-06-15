/**
 * apiRateLimit.js — Per-client rate limiter (in-memory)
 * Setiap API client punya limit sendiri dari api_clients.rate_limit_per_minute
 */

const clientBuckets = new Map(); // client_id → { count, resetAt }

/**
 * Middleware: Rate limiting per API client
 */
export const apiRateLimit = (req, res, next) => {
  if (!req.apiClient) return next(); // Skip jika belum auth

  const clientId = req.apiClient.id;
  const limit = req.apiClient.rate_limit_per_minute || 60;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 menit

  let bucket = clientBuckets.get(clientId);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    clientBuckets.set(clientId, bucket);
  }

  bucket.count++;

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - bucket.count));
  res.setHeader('X-RateLimit-Reset', new Date(bucket.resetAt).toISOString());

  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik.`,
      retry_after: retryAfter
    });
  }

  next();
};

// Cleanup old buckets setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of clientBuckets.entries()) {
    if (now > bucket.resetAt + 60000) clientBuckets.delete(key);
  }
}, 5 * 60 * 1000);
