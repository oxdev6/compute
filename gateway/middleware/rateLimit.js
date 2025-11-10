/**
 * Rate Limiting Middleware
 * Implements sliding window rate limiting
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.maxRequests = options.maxRequests || 100; // 100 requests per window
    this.store = new Map(); // In production, use Redis
  }

  /**
   * Check if request should be allowed
   * @param {string} key - Rate limit key (IP, API key, etc.)
   * @returns {boolean} - Whether request is allowed
   */
  check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create entry
    if (!this.store.has(key)) {
      this.store.set(key, []);
    }

    const requests = this.store.get(key);

    // Remove old requests outside window
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    return true;
  }

  /**
   * Get remaining requests
   * @param {string} key - Rate limit key
   * @returns {number} - Remaining requests
   */
  remaining(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.store.has(key)) {
      return this.maxRequests;
    }

    const requests = this.store.get(key);
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift();
    }

    return Math.max(0, this.maxRequests - requests.length);
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Rate limit key
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, requests] of this.store.entries()) {
      // Remove old requests
      while (requests.length > 0 && requests[0] < windowStart) {
        requests.shift();
      }

      // Remove empty entries
      if (requests.length === 0) {
        this.store.delete(key);
      }
    }
  }
}

// Create rate limiters
const ipRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
});

const apiKeyRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 1000, // Higher limit for API keys
});

// Cleanup old entries every 5 minutes
setInterval(() => {
  ipRateLimiter.cleanup();
  apiKeyRateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Express middleware for rate limiting
 */
function rateLimitMiddleware(req, res, next) {
  // Get identifier (IP or API key)
  const identifier = req.headers['x-api-key'] || req.ip || req.connection.remoteAddress;
  const limiter = req.headers['x-api-key'] ? apiKeyRateLimiter : ipRateLimiter;

  if (!limiter.check(identifier)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: 60, // seconds
      remaining: 0,
    });
  }

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': limiter.maxRequests,
    'X-RateLimit-Remaining': limiter.remaining(identifier),
    'X-RateLimit-Reset': new Date(Date.now() + limiter.windowMs).toISOString(),
  });

  next();
}

module.exports = {
  rateLimitMiddleware,
  RateLimiter,
};

