/**
 * Runs the real server against a throwaway in-memory MongoDB and seeds it with
 * demo data, so the app can be exercised end to end without an Atlas cluster.
 *
 *   npm run dev:memory
 *
 * Everything is discarded when the process exits. Use this for local testing
 * only — set MONGO_URI in .env for anything you want to keep.
 */
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcrypt");

(async () => {
  const mongod = await MongoMemoryServer.create();

  process.env.MONGO_URI = mongod.getUri("eagri");
  process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret";
  process.env.NODE_ENV = "development";

  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGO_URI);

  const User = require("../models/User");
  const Product = require("../models/Product");
  const Post = require("../models/Post");

  const password = await bcrypt.hash("password123", 10);
  const mkUser = (name, email) =>
    User.create({
      name,
      email,
      password,
      phone: "01712345678",
      address: { street: "12 Green Road", city: "Dhaka", country: "Bangladesh", postalCode: "1205" },
      verified: true,
      location: { type: "Point", coordinates: [90.4125, 23.8103] },
    });

  const farmer = await mkUser("Rahim Uddin", "rahim@eagri.test");
  const buyer = await mkUser("Karim Ahmed", "karim@eagri.test");

  const products = [
    { name: "Hybrid Paddy Seed (BRRI 28)", category: "Seeds", productType: "buy", price: 850, stock: 40,
      description: "High-yield paddy seed, 1kg pack. Suited to Boro season." },
    { name: "Urea Fertilizer 50kg", category: "Fertilizers", productType: "buy", price: 1350, stock: 25,
      description: "Granular urea, 46% nitrogen. Sealed 50kg sack." },
    { name: "Power Tiller", category: "Machinery", productType: "rent", rentPrice: 1200, price: 0, stock: 3,
      description: "12 HP diesel power tiller with rotavator attachment." },
    { name: "Rice Harvester", category: "Machinery", productType: "both", price: 285000, rentPrice: 3500, stock: 2,
      description: "Mini combine harvester. Buy outright or rent by the day." },
    { name: "Knapsack Sprayer 16L", category: "Tools", productType: "both", price: 2200, rentPrice: 150, stock: 12,
      description: "Manual lever-operated sprayer with adjustable nozzle." },
  ];

  await Product.insertMany(
    products.map((p) => ({
      ...p,
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      seller: farmer._id,
      location: { type: "Point", coordinates: [90.4125, 23.8103] },
    }))
  );

  await Post.create([
    { userId: farmer._id, text: "Boro transplanting finished on the north plot. Anyone else seeing leaf blast this early?" },
    { userId: buyer._id, text: "Power tiller available for rent this week around Savar — message me." },
  ]);

  console.log("\n  In-memory MongoDB ready — data is NOT persisted.");
  console.log("  Sign in with either account, password: password123");
  console.log("    rahim@eagri.test  (seller: 5 listings)");
  console.log("    karim@eagri.test  (buyer)\n");

  require("../server");

  const shutdown = async () => {
    await mongoose.disconnect().catch(() => {});
    await mongod.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
})().catch((err) => {
  console.error("Failed to start in-memory server:", err);
  process.exit(1);
});
