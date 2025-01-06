const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();
const app = express();
app.use(cors());
const port = 3000;

app.use(express.json());


// Routes Part
const combinedRoutes = require('./routes/combinedRoutes');

app.use('/', combinedRoutes);

// Error Handling Middleware

app.use(cors({
  origin: '*', // Be more restrictive in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
      success: false,
      message: 'Something broke!',
      error: err.message
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.get("/about", (req, res) => {
//   res.send("About Us");
// });

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


