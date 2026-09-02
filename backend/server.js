require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initFirebase } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ───────────────────────────────────────────────────────
// In production, ALLOWED_ORIGINS env var must be set to your frontend URL(s).
// Example: ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Fallback for local development when no env is set
const isDev = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (isDev && allowedOrigins.length === 0) {
      // In dev mode with no restriction set, allow all
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
};

app.use(helmet());
app.use(cors(corsOptions));

// Increase payload limit for base64 images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Apply general rate limiting
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

// ─── Firebase Init ───────────────────────────────────────────────────────────
initFirebase();

// ─── Routes ──────────────────────────────────────────────────────────────────
const processDataRoute = require('./routes/processData');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const ocrRoute = require('./routes/ocrRoute');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/', processDataRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ocr', ocrRoute);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — never expose stack traces in production
app.use((err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const corsMode = isDev && allowedOrigins.length === 0
    ? '⚠️  ALL ORIGINS (dev mode)'
    : allowedOrigins.join(', ') || '⚠️  NONE (set ALLOWED_ORIGINS)';

  console.log(`\n🚀 LoanIQ Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health:   http://localhost:${PORT}/health`);
  console.log(`🔗 Process:  http://localhost:${PORT}/process-data`);
  console.log(`🌐 CORS:     ${corsMode}\n`);
});

module.exports = app;
