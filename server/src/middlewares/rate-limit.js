const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const STORE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const ipRequestStore = new Map();
let lastCleanupAt = 0;

function cleanupExpiredEntries(now) {
  if (now - lastCleanupAt < STORE_CLEANUP_INTERVAL_MS) return;

  for (const [ip, entry] of ipRequestStore.entries()) {
    if (entry.resetAt <= now) {
      ipRequestStore.delete(ip);
    }
  }

  lastCleanupAt = now;
}

function normalizeIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function chatRateLimiter(req, res, next) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const clientIp = normalizeIp(req);
  const existing = ipRequestStore.get(clientIp);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + WINDOW_MS;
    ipRequestStore.set(clientIp, { count: 1, resetAt });

    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader('X-RateLimit-Remaining', String(MAX_REQUESTS_PER_WINDOW - 1));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    return next();
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)));

    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again in a minute.',
      retryAfterSeconds,
    });
  }

  existing.count += 1;
  ipRequestStore.set(clientIp, existing);

  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS_PER_WINDOW - existing.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(existing.resetAt / 1000)));

  return next();
}

module.exports = {
  chatRateLimiter,
};
