const express = require("express");
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const ResearchController = require('../controllers/ResearchController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const PostController = require('../controllers/PostController');
const adminController = require("../controllers/AdminController");
const { productController } = require("../controllers/ProductController");
//const rentalController = require("../controllers/RentalController");
const { orderController } = require("../controllers/OrderController");


// Authentication routes
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/verify-email/:token", AuthController.verifyEmail);
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
router.get('/posts/user/:userId', authMiddleware, PostController.getUserPosts);
router.delete('/posts/:postId', authMiddleware, PostController.deletePost);
router.put('/posts/:postId', authMiddleware, uploadMiddleware, PostController.updatePost);

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
// router.post("/rentals", authMiddleware, rentalController.createRental);
// router.get("/rentals/user", authMiddleware, rentalController.getUserRentals);
// router.put("/rentals/:rentalId/complete", authMiddleware, rentalController.completeRental);
// router.put("/rentals/:rentalId/extend", authMiddleware, rentalController.extendRental);

module.exports = router;
