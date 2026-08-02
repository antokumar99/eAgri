/**
 * Full functional walkthrough of every feature, against a throwaway in-memory
 * MongoDB. Complements smoke.test.js (which targets specific past defects) by
 * exercising each user-facing flow end to end.
 *
 *   npm run test:full
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

let pass = 0, fail = 0;
const section = (t) => console.log(`\n${t}`);
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('eagri-full');
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  process.env.AUTO_VERIFY_USERS = 'true';
  process.env.STORE_ID = '';           // exercise the unconfigured-gateway path
  process.env.STORE_PASSWD = '';
  process.env.BACKEND_URL = 'http://localhost:3000';

  await mongoose.connect(process.env.MONGO_URI);

  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/', require('../routes/combinedRoutes'));

  // Mirror server.js so the JSON 404 contract is actually covered.
  app.use((req, res) =>
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    })
  );

  const Product = require('../models/Product');
  const User = require('../models/User');

  const api = () => request(app);
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  // ---------------------------------------------------------------- accounts
  section('AUTHENTICATION');

  const signup = (email, name) =>
    api().post('/register').send({
      name, email, password: 'password123', phone: '01712345678',
      address: { street: '1 Green Rd', city: 'Dhaka', country: 'Bangladesh', postalCode: '1205' },
    });

  let r = await signup('seller@test.com', 'Rahim Uddin');
  ok('register seller', r.status === 201, `-> ${r.status} ${r.body.message}`);

  r = await signup('seller@test.com', 'Dup');
  ok('duplicate email rejected', r.status === 400, `-> ${r.status}`);

  await signup('buyer@test.com', 'Karim Ahmed');

  r = await api().post('/login').send({ email: 'seller@test.com', password: 'wrong' });
  ok('wrong password rejected', r.status === 401, `-> ${r.status}`);

  r = await api().post('/login').send({ email: 'nobody@test.com', password: 'password123' });
  ok('unknown email rejected', r.status === 404, `-> ${r.status}`);

  const sellerTok = (await api().post('/login').send({ email: 'seller@test.com', password: 'password123' })).body.token;
  const buyerTok  = (await api().post('/login').send({ email: 'buyer@test.com',  password: 'password123' })).body.token;
  ok('login issues tokens', Boolean(sellerTok && buyerTok));

  r = await api().get('/profile');
  ok('protected route needs a token', r.status === 401, `-> ${r.status}`);

  r = await api().get('/profile').set(auth(buyerTok));
  ok('GET /profile', r.status === 200 && r.body.data.email === 'buyer@test.com');

  const buyerId = r.body.data._id;

  r = await api().put('/profile').set(auth(buyerTok)).send({ name: 'Karim A.', farm: { title: 'Green Acres', experience: 6 } });
  ok('PUT /profile updates', r.body.data?.name === 'Karim A.' && r.body.data?.farm?.title === 'Green Acres');

  r = await api().get(`/users/${buyerId}`).set(auth(sellerTok));
  ok('GET /users/:id (other profile)', r.status === 200 && !r.body.data.password);

  // ---------------------------------------------------------------- products
  section('PRODUCTS');

  const seller = await User.findOne({ email: 'seller@test.com' });
  const mk = (o) => Product.create({
    name: o.name, description: o.desc, category: o.cat, stock: o.stock,
    image: 'https://img/x.jpg', seller: seller._id, productType: o.type,
    price: o.price, rentPrice: o.rent,
    location: { type: 'Point', coordinates: [90.4125, 23.8103] },
  });

  const seed    = await mk({ name: 'Paddy Seed', desc: 'BRRI 28',   cat: 'Seeds',     stock: 40, type: 'buy',  price: 850 });
  const tiller  = await mk({ name: 'Power Tiller', desc: '12 HP',   cat: 'Machinery', stock: 2,  type: 'rent', price: 0, rent: 1200 });
  const sprayer = await mk({ name: 'Sprayer 16L',  desc: 'Manual',  cat: 'Tools',     stock: 10, type: 'both', price: 2200, rent: 150 });

  r = await api().get('/products');
  ok('list all products', r.body.products.length === 3, `-> ${r.body.products.length}`);

  r = await api().get('/products').query({ type: ['rent', 'both'] });
  ok('filter rentable', r.body.products.length === 2 && !r.body.products.some(p => p.name === 'Paddy Seed'));

  r = await api().get(`/products/${seed._id}`);
  ok('product by id populates seller', r.body.product.seller.name === 'Rahim Uddin');

  r = await api().get('/products/my-products').set(auth(sellerTok));
  ok("seller's own products", r.body.products.length === 3);

  r = await api().put(`/products/${seed._id}`).set(auth(buyerTok))
    .send({ name: 'Hijack', description: 'x', category: 'Seeds', stock: 1, productType: 'buy', price: 1 });
  ok('non-owner cannot edit', r.status === 403, `-> ${r.status}`);

  // ------------------------------------------------------------------- cart
  section('CART & PURCHASE');

  r = await api().post('/cart/add').set(auth(buyerTok)).send({ productId: seed._id, quantity: 3 });
  ok('add to cart', r.status === 200);

  r = await api().post('/cart/add').set(auth(buyerTok)).send({ productId: tiller._id, quantity: 1 });
  ok('rent-only blocked from cart', r.status === 400, `-> ${r.body.message}`);

  r = await api().post('/cart/add').set(auth(sellerTok)).send({ productId: seed._id, quantity: 1 });
  ok('cannot buy own product', r.status === 400);

  let cart = (await api().get('/cart').set(auth(buyerTok))).body.cart;
  ok('cart totals', cart.total === 2550, `-> ${cart.total}`);

  const itemId = cart.items[0]._id;
  r = await api().put(`/cart/item/${itemId}`).set(auth(buyerTok)).send({ quantity: 2 });
  ok('update quantity', r.body.cart.total === 1700, `-> ${r.body.cart?.total}`);

  r = await api().put(`/cart/item/${itemId}`).set(auth(buyerTok)).send({ quantity: 999 });
  ok('quantity beyond stock rejected', r.status === 400);

  await api().post('/cart/add').set(auth(buyerTok)).send({ productId: sprayer._id, quantity: 1 });
  cart = (await api().get('/cart').set(auth(buyerTok))).body.cart;
  ok('second line item', cart.items.length === 2 && cart.total === 3900, `-> ${cart.total}`);

  r = await api().delete(`/cart/item/${itemId}`).set(auth(buyerTok));
  ok('remove item', r.body.cart.items.length === 1);

  cart = (await api().get('/cart').set(auth(buyerTok))).body.cart;
  r = await api().post('/orders/create').set(auth(buyerTok))
    .send({ address: { street: '1 Rd', city: 'Dhaka', state: 'Dhaka', zipCode: '1205', phone: '01712345678' }, cartItems: cart.items, total: 1 });
  ok('COD order placed', r.status === 200);
  ok('server prices it (2200+50+30)', r.body.order.totalPrice === 2280, `-> ${r.body.order?.totalPrice}`);
  const orderId = r.body.orderId;

  ok('stock reserved 10->9', (await Product.findById(sprayer._id)).stock === 9);
  ok('cart emptied', (await api().get('/cart').set(auth(buyerTok))).body.cart.items.length === 0);

  // ------------------------------------------------------------------ orders
  section('ORDERS');

  r = await api().get('/orders/my-orders').set(auth(buyerTok));
  ok('buyer sees their order', r.body.orders.length === 1);

  r = await api().get('/orders/received').set(auth(sellerTok));
  ok('seller sees it with items', r.body.orders.length === 1 && r.body.orders[0].products.length === 1);
  ok("seller's subtotal", r.body.orders[0].sellerSubtotal === 2200, `-> ${r.body.orders[0]?.sellerSubtotal}`);

  r = await api().get(`/orders/${orderId}`).set(auth(buyerTok));
  ok('order detail (owner)', r.status === 200);

  const outsider = (await api().post('/login').send({ email: 'seller@test.com', password: 'password123' })).body.token;
  r = await api().put(`/orders/${orderId}/status`).set(auth(outsider)).send({ status: 'Shipped' });
  ok('seller ships order', r.status === 200 && r.body.order.status === 'Shipped');

  r = await api().put(`/orders/${orderId}/status`).set(auth(buyerTok)).send({ status: 'Delivered' });
  ok('buyer cannot set status', r.status === 403);

  r = await api().put(`/orders/${orderId}/status`).set(auth(sellerTok)).send({ status: 'Delivered' });
  ok('mark delivered', r.body.order.status === 'Delivered');

  r = await api().put(`/orders/${orderId}/status`).set(auth(sellerTok)).send({ status: 'Shipped' });
  ok('delivered is terminal', r.status === 400, `-> ${r.status}`);

  // ----------------------------------------------------------------- rentals
  section('RENTALS');

  r = await api().post('/rentals/create').set(auth(buyerTok))
    .send({ productId: tiller._id, durationValue: 1, durationUnit: 'week', paymentMethod: 'online' });
  ok('create rental', r.status === 201);
  ok('1 week @1200/day = 8400', r.body.rental.totalPrice === 8400, `-> ${r.body.rental?.totalPrice}`);
  const rentalId = r.body.rental._id;
  ok('stock reserved 2->1', (await Product.findById(tiller._id)).stock === 1);

  r = await api().post('/rentals/create').set(auth(buyerTok))
    .send({ productId: seed._id, durationValue: 1, durationUnit: 'day' });
  ok('buy-only not rentable', r.status === 400);

  r = await api().post('/rentals/create').set(auth(buyerTok))
    .send({ productId: tiller._id, durationValue: 0, durationUnit: 'day' });
  ok('zero duration rejected', r.status === 400);

  r = await api().post('/rentals/create').set(auth(buyerTok))
    .send({ productId: tiller._id, durationValue: 1, durationUnit: 'day', startDate: '2020-01-01' });
  ok('past start date rejected', r.status === 400);

  r = await api().get('/rentals/my-rentals').set(auth(buyerTok));
  ok('renter sees rental', r.body.rentals.length === 1);
  ok('virtuals serialized', 'isOverdue' in r.body.rentals[0] && 'remainingDays' in r.body.rentals[0]);

  r = await api().get('/rentals/received').set(auth(sellerTok));
  ok('owner sees incoming rental', r.body.rentals.length === 1);

  r = await api().post(`/rentals/${rentalId}/pay`).set(auth(buyerTok));
  ok('pay returns 503 when gateway unconfigured', r.status === 503, `-> ${r.status}`);

  r = await api().put(`/rentals/${rentalId}/status`).set(auth(sellerTok)).send({ status: 'active' });
  ok('owner activates rental', r.body.rental.status === 'active');

  r = await api().put(`/rentals/${rentalId}/extend`).set(auth(buyerTok)).send({ additionalDuration: 2, durationUnit: 'day' });
  ok('extend adds 2 x 1200', r.body.rental.totalPrice === 10800, `-> ${r.body.rental?.totalPrice}`);

  r = await api().put(`/rentals/${rentalId}/complete`).set(auth(sellerTok));
  ok('complete rental', r.body.rental.status === 'completed');
  ok('stock returned 1->2', (await Product.findById(tiller._id)).stock === 2);

  r = await api().put(`/rentals/${rentalId}/complete`).set(auth(sellerTok));
  ok('cannot complete twice', r.status === 400);

  // ---------------------------------------------------------------- payments
  section('PAYMENTS');

  cart = (await api().post('/cart/add').set(auth(buyerTok)).send({ productId: seed._id, quantity: 1 })).body;
  const liveCart = (await api().get('/cart').set(auth(buyerTok))).body.cart;

  r = await api().post('/payment').set(auth(buyerTok))
    .send({ address: { street: '1 Rd', city: 'Dhaka', state: 'Dhaka', zipCode: '1205', phone: '01712345678' }, cartItems: liveCart.items });
  ok('online payment 503 when unconfigured', r.status === 503, `-> ${r.status}`);
  ok('cart preserved on failure', (await api().get('/cart').set(auth(buyerTok))).body.cart.items.length === 1);

  r = await api().post('/payment/success').send({ tran_id: 'MADE_UP', status: 'VALID', val_id: 'x' });
  ok('unknown transaction handled', r.status === 200, `-> ${r.status}`);

  r = await api().get('/payment/result?status=success&orderId=x');
  ok('gateway result page renders', r.status === 200 && /Payment Successful/.test(r.text));

  r = await api().get(`/payment/status/${orderId}`).set(auth(sellerTok));
  ok('cannot read another user payment status', r.status === 403);

  // ------------------------------------------------------------------ social
  section('COMMUNITY');

  r = await api().post('/posts').set(auth(sellerTok)).field('text', 'Leaf blast on the north plot');
  ok('create post', r.status === 201, `-> ${r.status}`);
  const postId = r.body.data._id;

  r = await api().post('/posts').set(auth(sellerTok)).field('text', '');
  ok('empty post rejected', r.status === 400);

  r = await api().get('/posts').set(auth(buyerTok));
  ok('feed lists posts', r.body.data.length === 1);
  ok('pagination metadata', r.body.pagination?.total === 1);

  await api().post(`/posts/${postId}/like`).set(auth(buyerTok));
  await api().post(`/posts/${postId}/like`).set(auth(buyerTok));
  await api().post(`/posts/${postId}/like`).set(auth(buyerTok));
  r = await api().get('/posts').set(auth(buyerTok));
  ok('like persists, counted once', r.body.data[0].isLiked === true && r.body.data[0].likesCount === 1,
    `-> isLiked=${r.body.data[0].isLiked} count=${r.body.data[0].likesCount}`);

  r = await api().get('/posts').set(auth(sellerTok));
  ok('isLiked is per-viewer', r.body.data[0].isLiked === false && r.body.data[0].likesCount === 1);

  r = await api().post(`/posts/${postId}/comments`).set(auth(buyerTok)).send({ text: 'Try tricyclazole' });
  ok('add comment', r.status === 201);
  const commentId = r.body.data._id;

  r = await api().post(`/posts/${postId}/comments`).set(auth(sellerTok)).send({ text: 'Thanks', parentId: commentId });
  ok('add reply', r.status === 201 && String(r.body.data.parentId._id || r.body.data.parentId) === String(commentId));

  r = await api().get(`/posts/${postId}/comments`);
  ok('list comments', r.body.data.length === 2);

  r = await api().get('/posts').set(auth(buyerTok));
  ok('commentsCount in feed', r.body.data[0].commentsCount === 2, `-> ${r.body.data[0].commentsCount}`);

  r = await api().delete(`/posts/${postId}/comments/${commentId}`).set(auth(buyerTok));
  ok('delete own comment cascades reply', r.status === 200 && r.body.commentsCount === 0, `-> ${r.body.commentsCount}`);

  r = await api().get(`/posts/user/${seller._id}`).set(auth(buyerTok));
  ok("user's posts", r.body.data.length === 1);

  r = await api().delete(`/posts/${postId}`).set(auth(buyerTok));
  ok('cannot delete others post', r.status === 403);

  r = await api().delete(`/posts/${postId}`).set(auth(sellerTok));
  ok('author deletes post', r.status === 200);

  // ----------------------------------------------------------------- reviews
  section('REVIEWS');

  r = await api().post(`/products/${seed._id}/review`).set(auth(buyerTok)).send({ rating: 5, review: 'Great germination' });
  ok('add review', r.status === 200);

  r = await api().post(`/products/${seed._id}/review`).set(auth(buyerTok)).send({ rating: 1, review: 'again' });
  ok('one review per user', r.status === 400);

  await api().post(`/products/${seed._id}/review`).set(auth(sellerTok)).send({ rating: 3, review: 'ok' });
  ok('averageRating is the mean', (await Product.findById(seed._id)).averageRating === 4,
    `-> ${(await Product.findById(seed._id)).averageRating}`);

  // -------------------------------------------------------------- misc/infra
  section('INFRASTRUCTURE');

  r = await api().get('/research');
  ok('research: empty list is 200, not 404', r.status === 200 && Array.isArray(r.body), `-> ${r.status}`);

  r = await api().post('/research').send({ title: 'Anon paper', link: 'http://x', category: 'Agriculture' });
  ok('research write requires auth', r.status === 401, `-> ${r.status}`);

  r = await api().post('/research').set(auth(sellerTok))
    .send({ title: 'Soil pH study', link: 'http://example.com/p', category: 'Soil Science' });
  ok('research write with auth', r.status === 201, `-> ${r.status}`);

  r = await api().get('/research');
  ok('research lists the new entry', r.body.length === 1);

  r = await api().get('/no-such-route');
  ok('404 returns JSON', r.status === 404 && r.body.success === false);

  r = await api().get('/profile').set({ Authorization: 'Bearer not.a.real.token' });
  ok('malformed token rejected', r.status === 401);

  r = await api().get('/test-auth').set(auth(buyerTok));
  ok('token round-trips', r.body.success === true);

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(2); });
