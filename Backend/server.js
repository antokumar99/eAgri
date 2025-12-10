require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');
const fs = require('fs');
const { PORT, isProduction } = require('./config/appConfig');

// Fail fast rather than starting a server that cannot verify a single token or
// talk to the database.
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(', ')}\n` +
    'Copy Backend/.env.example to Backend/.env and fill it in.'
  );
  process.exit(1);
}

const app = express();

// CORS configuration
// `credentials: true` alongside `origin: '*'` is rejected by browsers, and the
// combination is unsafe anyway. The mobile app sends a bearer token rather than
// cookies, so credentials are not needed; set ALLOWED_ORIGINS to lock down any
// browser clients.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware. The limit stops an oversized JSON body from
// exhausting memory; image uploads go through multer, not these parsers.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
const combinedRoutes = require('./routes/combinedRoutes');
app.use('/', combinedRoutes);

// Health check, useful for confirming the phone can reach the API at all.
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// 404 handler — without this an unknown path fell through to nothing and the
// client saw an HTML error page where it expected JSON.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    // Internal messages can name collections, file paths and driver internals,
    // so they are only echoed outside production.
    error: isProduction
      ? 'Internal server error'
      : err.message || 'Internal server error'
  });
});

// Start server only after successful database connection
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// A rejected promise anywhere in a request used to kill the whole process,
// taking every in-flight request with it. Log it and keep serving.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
