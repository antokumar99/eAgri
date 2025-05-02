const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: '*', // In production, specify your actual domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
const combinedRoutes = require('./routes/combinedRoutes');
app.use('/', combinedRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const port = process.env.PORT || 3000;

// Start server only after successful database connection
const startServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

// Handle database connection errors
process.on('unhandledRejection', (err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Start the server
startServer();

// app.post("/create", (req, res) => {
//   const { title, description } = req.body;
//   res.json({ title, description });
// });

// app.post("/register", async (req, res) => {
// const { username, email, password, phone } = req.body;
//   try {
//     const user = new User({
//       username,
//       email,
//       password,
//       phone,
//     });
//     await user.save();
//     res.status(201).json({ user });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
//   Auth.register(req, res);
// });

// app.post("/login", async (req, res) => {
//    Auth.login(req, res);
// });

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send("Something broke!");
// });


