/**
 * End-to-end smoke test against an in-memory MongoDB.
 * Exercises the flows that were changed: buy, cart, COD checkout, rentals,
 * posts/likes/comments, and the payment callback authorization.
 */
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.STORE_ID = "teststore";
  process.env.STORE_PASSWD = "testpass";
  process.env.BACKEND_URL = "http://localhost:3000";

  await mongoose.connect(process.env.MONGO_URI);

  const express = require("express");
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/", require("../routes/combinedRoutes"));

  const User = require("../models/User");
  const Product = require("../models/Product");
  const Order = require("../models/Order");
  const Rental = require("../models/Rental");

  const mkUser = async (name, email) =>
    User.create({
      name, email, password: await bcrypt.hash("pw", 4), phone: "01712345678",
      address: { street: "1 Rd", city: "Dhaka", country: "BD", postalCode: "1000" },
      verified: true,
    });

  const buyer = await mkUser("Buyer", "buyer@test.com");
  const seller = await mkUser("Seller", "seller@test.com");
  const tok = (u) => jwt.sign({ id: u._id, email: u.email }, process.env.JWT_SECRET);
  const bTok = tok(buyer), sTok = tok(seller);

  const mkProduct = (over = {}) =>
    Product.create({
      name: "Tractor", description: "Big", category: "Machinery", stock: 5,
      image: "http://img", seller: seller._id, productType: "both",
      price: 1000, rentPrice: 100,
      location: { type: "Point", coordinates: [90, 23] },
      ...over,
    });

  const addr = { street: "1 Rd", city: "Dhaka", state: "Dhaka", zipCode: "1000", phone: "01712345678" };

  console.log("\n=== Cart & purchase ===");
  let p = await mkProduct();

  let r = await request(app).post("/cart/add").set("Authorization", `Bearer ${bTok}`)
    .send({ productId: p._id, quantity: 2 });
  check("add to cart", r.status === 200, `-> ${r.status} ${r.body.message}`);

  r = await request(app).post("/cart/add").set("Authorization", `Bearer ${bTok}`)
    .send({ productId: p._id, quantity: 0 });
  check("rejects quantity 0", r.status === 400, `-> ${r.status}`);

  r = await request(app).post("/cart/add").set("Authorization", `Bearer ${bTok}`)
    .send({ productId: p._id, quantity: 99 });
  check("rejects beyond stock (cumulative)", r.status === 400, `-> ${r.status} ${r.body.message}`);

  r = await request(app).post("/cart/add").set("Authorization", `Bearer ${sTok}`)
    .send({ productId: p._id, quantity: 1 });
  check("seller cannot buy own product", r.status === 400, `-> ${r.status}`);

  const rentOnly = await mkProduct({ productType: "rent", price: undefined, rentPrice: 50 });
  r = await request(app).post("/cart/add").set("Authorization", `Bearer ${bTok}`)
    .send({ productId: rentOnly._id, quantity: 1 });
  check("rent-only cannot be added to cart", r.status === 400, `-> ${r.status}`);

  console.log("\n=== COD checkout: server-side pricing ===");
  const cart = (await request(app).get("/cart").set("Authorization", `Bearer ${bTok}`)).body.cart;

  r = await request(app).post("/orders/create").set("Authorization", `Bearer ${bTok}`)
    .send({ address: addr, cartItems: cart.items, total: 1 }); // client tries to pay 1 taka
  check("COD order created", r.status === 200, `-> ${r.status} ${r.body.message}`);
  // 2 x 1000 + 50 delivery + 30 COD = 2080
  check("client-supplied total ignored (2080)", r.body.order?.totalPrice === 2080,
    `-> got ${r.body.order?.totalPrice}`);
  check("COD fee actually charged", r.body.order?.codFee === 30, `-> got ${r.body.order?.codFee}`);

  p = await Product.findById(p._id);
  check("stock decremented 5 -> 3", p.stock === 3, `-> got ${p.stock}`);

  const order = await Order.findById(r.body.orderId);

  console.log("\n=== Order status update (used to 500) ===");
  r = await request(app).put(`/orders/${order._id}/status`).set("Authorization", `Bearer ${sTok}`)
    .send({ status: "Shipped" });
  check("seller can update status", r.status === 200, `-> ${r.status} ${JSON.stringify(r.body).slice(0,120)}`);

  r = await request(app).put(`/orders/${order._id}/status`).set("Authorization", `Bearer ${bTok}`)
    .send({ status: "Delivered" });
  check("buyer cannot update status", r.status === 403, `-> ${r.status}`);

  r = await request(app).put(`/orders/${order._id}/status`).set("Authorization", `Bearer ${sTok}`)
    .send({ status: "Cancelled" });
  check("cancel restores stock", (await Product.findById(p._id)).stock === 5,
    `-> got ${(await Product.findById(p._id)).stock}`);

  r = await request(app).put(`/orders/${order._id}/status`).set("Authorization", `Bearer ${sTok}`)
    .send({ status: "Cancelled" });
  check("double-cancel does not double-restore", (await Product.findById(p._id)).stock === 5,
    `-> got ${(await Product.findById(p._id)).stock}`);

  console.log("\n=== Rentals ===");
  const rp = await mkProduct({ stock: 1, productType: "rent", price: 0, rentPrice: 100 });

  r = await request(app).post("/rentals/create").set("Authorization", `Bearer ${bTok}`)
    .send({ productId: rp._id, durationValue: 1, durationUnit: "month", paymentMethod: "online" });
  check("rental created", r.status === 201, `-> ${r.status} ${r.body.message}`);
  check("month = 30 days @100 = 3000", r.body.rental?.totalPrice === 3000, `-> ${r.body.rental?.totalPrice}`);
  check("rental stock reserved", (await Product.findById(rp._id)).stock === 0);

  const rentalId = r.body.rental._id;

  r = await request(app).post("/rentals/create").set("Authorization", `Bearer ${bTok}`)
    .send({ productId: rp._id, durationValue: 1, durationUnit: "day" });
  check("out of stock rejected", r.status === 400, `-> ${r.status}`);

  const buyOnly = await mkProduct({ productType: "buy", rentPrice: undefined });
  r = await request(app).post("/rentals/create").set("Authorization", `Bearer ${bTok}`)
    .send({ productId: buyOnly._id, durationValue: 1, durationUnit: "day" });
  check("buy-only cannot be rented", r.status === 400, `-> ${r.status} ${r.body.message}`);

  r = await request(app).post("/rentals/create").set("Authorization", `Bearer ${sTok}`)
    .send({ productId: rp._id, durationValue: 1, durationUnit: "day" });
  check("seller cannot rent own product", r.status === 400, `-> ${r.status}`);

  r = await request(app).put(`/rentals/${rentalId}/cancel`).set("Authorization", `Bearer ${bTok}`).send();
  check("cancel rental succeeds", r.status === 200, `-> ${r.status}`);
  check("CANCEL RESTORES STOCK (was the bug)", (await Product.findById(rp._id)).stock === 1,
    `-> got ${(await Product.findById(rp._id)).stock}`);

  console.log("\n=== Payment authorization ===");
  const paidOrder = await Order.create({
    user: buyer._id, products: [{ product: p._id, quantity: 1, price: 1000 }],
    totalPrice: 1050, paymentMethod: "Online Payment", transactionId: "EAGRI_x_1",
  });

  r = await request(app).post("/payment/success").send({ tran_id: "EAGRI_x_1", status: "VALID" });
  const after = await Order.findById(paidOrder._id);
  check("forged success without val_id cannot mark paid", after.paymentStatus !== "Paid",
    `-> paymentStatus=${after.paymentStatus}`);

  r = await request(app).get(`/payment/status/${paidOrder._id}`).set("Authorization", `Bearer ${sTok}`);
  check("other user cannot read payment status", r.status === 403, `-> ${r.status}`);

  r = await request(app).get(`/payment/status/${paidOrder._id}`).set("Authorization", `Bearer ${bTok}`);
  check("owner can read payment status", r.status === 200 && r.body.paymentStatus === "Failed",
    `-> ${r.status} ${r.body.paymentStatus}`);

  console.log("\n=== Posts / likes / comments ===");
  const Post = require("../models/Post");
  const post = await Post.create({ userId: seller._id, text: "Hello farmers" });

  r = await request(app).get("/posts").set("Authorization", `Bearer ${bTok}`);
  check("feed returns posts", r.body.data?.length === 1, `-> ${r.body.data?.length}`);
  check("feed reports isLiked=false", r.body.data[0].isLiked === false);

  await request(app).post(`/posts/${post._id}/like`).set("Authorization", `Bearer ${bTok}`).send();
  await request(app).post(`/posts/${post._id}/like`).set("Authorization", `Bearer ${bTok}`).send();
  await request(app).post(`/posts/${post._id}/like`).set("Authorization", `Bearer ${bTok}`).send();
  r = await request(app).get("/posts").set("Authorization", `Bearer ${bTok}`);
  check("LIKE PERSISTS ACROSS FETCH (was the bug)", r.body.data[0].isLiked === true,
    `-> ${r.body.data[0].isLiked}`);
  check("triple-tap yields count 1, not 3", r.body.data[0].likesCount === 1,
    `-> ${r.body.data[0].likesCount}`);

  r = await request(app).get("/posts");
  check("anonymous feed works, isLiked=false", r.status === 200 && r.body.data[0].isLiked === false);

  r = await request(app).post(`/posts/${post._id}/comments`).set("Authorization", `Bearer ${bTok}`)
    .send({ text: "   " });
  check("empty comment rejected", r.status === 400, `-> ${r.status}`);

  r = await request(app).post(`/posts/${post._id}/comments`).set("Authorization", `Bearer ${bTok}`)
    .send({ text: "Nice tractor" });
  check("comment added", r.status === 201, `-> ${r.status}`);

  r = await request(app).get("/posts").set("Authorization", `Bearer ${bTok}`);
  check("commentsCount reported", r.body.data[0].commentsCount === 1, `-> ${r.body.data[0].commentsCount}`);

  const Comment = require("../models/Comment");
  await request(app).delete(`/posts/${post._id}`).set("Authorization", `Bearer ${sTok}`).send();
  check("deleting post removes its comments", (await Comment.countDocuments({ postId: post._id })) === 0);

  console.log("\n=== Ratings ===");
  const rated = await mkProduct();
  await request(app).post(`/products/${rated._id}/review`).set("Authorization", `Bearer ${bTok}`)
    .send({ rating: 5, review: "great" });
  await request(app).post(`/products/${rated._id}/review`).set("Authorization", `Bearer ${sTok}`)
    .send({ rating: 3, review: "ok" });
  const ratedDoc = await Product.findById(rated._id);
  check("averageRating is a MEAN not a SUM (was 8)", ratedDoc.averageRating === 4,
    `-> ${ratedDoc.averageRating}`);

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
