const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const UserController = require("../controllers/UserController");
const ResearchController = require("../controllers/ResearchController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const PostController = require("../controllers/PostController");
const adminController = require("../controllers/AdminController");
const { productController } = require("../controllers/ProductController");
const { rentalController } = require("../controllers/RentalController");
const { orderController } = require("../controllers/OrderController");
const { paymentController } = require("../controllers/paymentController");

// Authentication routes
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/verify-email/:token", AuthController.verifyEmail);
router.get("/verification-success", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Email Verification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 40px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #008E97;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Success!</h1>
          <p>Your email has been verified successfully.</p>
          <p>You can now close this window and login to the app.</p>
        </div>
      </body>
    </html>
  `);
});
router.post("/resend-verification", AuthController.resendVerification);
// router.get('/verify-email/:token', AuthController.verifyEmail);

// Admin routes
// router.post('/admin/register', adminController.registerAdmin);
// router.use(authMiddleware);
// router.post('/admin/login', adminController.loginAdmin);

// User routes
// router.get('/profile', UserController.getProfile);
router.get("/profile", authMiddleware, UserController.getProfile);
router.put("/profile", authMiddleware, UserController.updateProfile);
router.get("/users/:userId", authMiddleware, UserController.getUserById);

// Research routes
router.get("/research", ResearchController.getAllResearch);
router.post("/research", ResearchController.addResearch);

// Post routes
router.post(
  "/posts",
  authMiddleware,
  uploadMiddleware,
  PostController.createPost
);
router.get("/posts", PostController.getAllPosts);
router.post("/posts/:postId/like", authMiddleware, PostController.likePost);
router.get("/posts/user/:userId", authMiddleware, PostController.getUserPosts);
router.delete("/posts/:postId", authMiddleware, PostController.deletePost);
router.put(
  "/posts/:postId",
  authMiddleware,
  uploadMiddleware,
  PostController.updatePost
);
router.get("/posts/:postId/comments", PostController.getComments);
router.post(
  "/posts/:postId/comments",
  authMiddleware,
  PostController.addComment
);
router.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  PostController.deleteComment
);

// Product routes
router.get(
  "/products/my-products",
  authMiddleware,
  productController.getMyProducts
);

router.post(
  "/addproducts",
  authMiddleware,
  uploadMiddleware,
  productController.createProduct
);

router.get("/products", productController.getAllProducts);

router.get("/products/:id", productController.getProductById);
router.put(
  "/products/:id",
  authMiddleware,
  uploadMiddleware,
  productController.updateProduct
);
router.delete("/products/:id", authMiddleware, productController.deleteProduct);
router.post(
  "/products/:id/review",
  authMiddleware,
  productController.addProductReview
);

// Cart routes
router.post("/cart/add", authMiddleware, orderController.addToCart);
router.get("/cart", authMiddleware, orderController.getCart);
router.put(
  "/cart/item/:itemId",
  authMiddleware,
  orderController.updateCartItem
);
router.delete(
  "/cart/item/:itemId",
  authMiddleware,
  orderController.removeFromCart
);
router.delete("/cart", authMiddleware, orderController.clearCart);

// Order routes
router.post("/orders/create", authMiddleware, orderController.createOrder);
router.get("/orders/my-orders", authMiddleware, orderController.getUserOrders);
router.get(
  "/orders/received",
  authMiddleware,
  orderController.getReceivedOrders
);
router.get("/orders/:orderId", authMiddleware, orderController.getOrderById);
router.put(
  "/orders/:orderId/status",
  authMiddleware,
  orderController.updateOrderStatus
);

// Add this route to test authentication
router.get("/test-auth", authMiddleware, (req, res) => {
  console.log("Test auth endpoint hit");
  console.log("User from request:", req.user);
  res.json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});

// Rental routes
router.post("/rentals/create", authMiddleware, rentalController.createRental);
router.get(
  "/rentals/my-rentals",
  authMiddleware,
  rentalController.getUserRentals
);
router.get(
  "/rentals/received",
  authMiddleware,
  rentalController.getReceivedRentals
);
router.get(
  "/rentals/:rentalId",
  authMiddleware,
  rentalController.getRentalById
);
router.put(
  "/rentals/:rentalId/status",
  authMiddleware,
  rentalController.updateRentalStatus
);
router.put(
  "/rentals/:rentalId/extend",
  authMiddleware,
  rentalController.extendRental
);
router.put(
  "/rentals/:rentalId/cancel",
  authMiddleware,
  rentalController.cancelRental
);
router.put(
  "/rentals/:rentalId/complete",
  authMiddleware,
  rentalController.completeRental
);

// Payment routes
router.post("/payment", authMiddleware, paymentController.createPayment);
router.post(
  "/payment/success",
  authMiddleware,
  paymentController.paymentSuccess
);
router.post("/payment/fail", authMiddleware, paymentController.paymentFailure);
router.post("/payment/cancel", authMiddleware, paymentController.paymentCancel);
router.post("/payment/ipn", paymentController.paymentIPN); // No auth for IPN

module.exports = router;
