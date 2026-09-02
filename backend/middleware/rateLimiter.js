const rateLimit = require('express-rate-limit');

// 100 requests per 15 minutes for general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 10 requests per 15 minutes for strict routes like login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
});

// Processing limit (computationally heavy)
const processLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 loans per hour max per IP
  message: { success: false, error: 'Loan processing limit reached for this IP. Please try again later.' },
});

// Security Fallback: Block IPs that repeatedly fail or attempt fraud
const fraudLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 failed/abusive requests before locking IP
  message: { success: false, error: 'SECURITY ALERT: IP locked due to multiple suspicious activities or failed verifications. Contact support.' },
});

module.exports = { apiLimiter, authLimiter, processLimiter, fraudLimiter };
