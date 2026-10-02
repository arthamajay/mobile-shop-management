require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { setBroadcastFn } = require('./utils/alertEngine');

// ── Startup environment validation ────────────────────────────────────────────
// Fail fast in production if critical env vars are missing or obviously weak.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('[startup] JWT_SECRET is too short — use at least 32 characters in production.');
    process.exit(1);
  }
}

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const billRoutes = require('./routes/bills');
const transferRoutes = require('./routes/transfers');
const alertRoutes = require('./routes/alerts');
const analyticsRoutes = require('./routes/analytics');
const reconciliationRoutes = require('./routes/reconciliation');
const sseRoutes = require('./routes/sse');

// Connect to MongoDB
connectDB();

const app = express();

// Inject SSE broadcast function into alert engine (avoids circular dependency)
setBroadcastFn(sseRoutes.broadcastAlert);

// ── Security headers ───────────────────────────────────────────────────────────
// helmet sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
// Content-Security-Policy is disabled here because the frontend is a separate
// origin served by Vite (dev) or a CDN (prod) — configure CSP at the CDN/Nginx layer.
app.use(helmet({ contentSecurityPolicy: false }));

// ── Trust proxy (required for correct req.ip behind Nginx / Heroku / Railway) ─
app.set('trust proxy', 1);

// ── CORS — must come before other middleware so preflight requests are handled ─
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logging ───────────────────────────────────────────────────────
// 'combined' (Apache format) in production for structured log ingestion.
// 'dev' in development for human-readable coloured output.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Static file serving ────────────────────────────────────────────────────────
// Generated PDF invoices are served from /uploads/pdfs/.
// In production, consider moving PDFs behind an authenticated endpoint or
// serving them via a signed URL from object storage (S3, GCS, etc.).
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/sse', sseRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
