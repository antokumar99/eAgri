require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');
const fs = require('fs');
const { PORT, isProduction, BACKEND_URL } = require('./config/appConfig');

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
  // Bind on 0.0.0.0 so phones on the same Wi-Fi can reach it, not just this
  // machine. The addresses are printed because "the app can't connect" is
  // almost always a wrong-host problem.
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Server running`);
    console.log(`    local:   http://localhost:${PORT}`);
    console.log(`    network: ${BACKEND_URL}   <- phones use this\n`);
  });

  // Without a handler, an in-use port surfaces as an unhandled 'error' event
  // and a 20-line stack trace that says nothing about how to fix it. This is
  // the single most common startup failure: a previous run is still alive,
  // usually because a terminal was closed without stopping it.
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n  Port ${PORT} is already in use — another copy of this server is running.\n\n` +
        `  Find and stop it:\n` +
        `    Windows:      npx kill-port ${PORT}\n` +
        `                  (or) netstat -ano | findstr :${PORT}   then   taskkill /PID <pid> /F\n` +
        `    macOS/Linux:  lsof -ti:${PORT} | xargs kill -9\n\n` +
        `  Or run this one on a different port:  PORT=3001 npm run dev\n`
      );
    } else if (err.code === 'EACCES') {
      console.error(`\n  Not allowed to bind port ${PORT}. Try a port above 1024.\n`);
    } else {
      console.error('\n  Server error:', err.message, '\n');
    }
    process.exit(1);
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
