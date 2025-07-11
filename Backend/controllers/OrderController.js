const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const orderController = {
  // Add to cart
  addToCart: async (req, res) => {
    try {
      const { productId, quantity, isRental } = req.body;
      const userId = req.user.id;

      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: "Not enough stock available",
        });
      }

      // Validate price based on rental status
      const price = isRental ? product.rentPrice : product.price;
      if (typeof price !== "number" || isNaN(price)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price",
        });
      }

      // Find user's cart or create new one
      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          total: 0,
        });
      }

      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId && item.isRental === isRental
      );

      if (existingItemIndex !== -1) {
        // Update quantity if product already in cart
        cart.items[existingItemIndex].quantity += quantity;
        cart.items[existingItemIndex].total =
          cart.items[existingItemIndex].quantity * price;
      } else {
        // Add new item to cart
        cart.items.push({
          product: productId,
          quantity: quantity,
          price: price,
          isRental: isRental,
          total: quantity * price,
        });
      }

      // Calculate cart total
      cart.total = cart.items.reduce((sum, item) => {
        return sum + item.quantity * item.price;
      }, 0);

      await cart.save();

      // Populate product details
      const populatedCart = await Cart.findById(cart._id).populate({
        path: "items.product",
        select: "name image price rentPrice productType",
      });

      res.status(200).json({
        success: true,
        message: "Product added to cart successfully",
        cart: populatedCart,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({
        success: false,
        message: "Error adding to cart",
        error: error.message,
      });
    }
  },

  // Get cart
  getCart: async (req, res) => {
    try {
      console.log("Fetching cart data...");
      const userId = req.user.id;

      // Find cart and populate all necessary product and user details
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: "items.product",
          select:
            "name description image price rentPrice productType stock category averageRating ratings seller",
          populate: {
            path: "seller",
            select: "name email",
          },
        })
        .populate({
          path: "user",
          select: "name email",
        });

      if (!cart) {
        return res.status(200).json({
          success: true,
          cart: {
            items: [],
            total: 0,
          },
        });
      }

      // Transform cart data to include calculated fields
      const transformedCart = {
        _id: cart._id,
        user: cart.user,
        items: cart.items.map((item) => ({
          _id: item._id,
          product: {
            _id: item.product._id,
            name: item.product.name,
            description: item.product.description,
            image: item.product.image,
            price: item.product.price,
            rentPrice: item.product.rentPrice,
            productType: item.product.productType,
            stock: item.product.stock,
            category: item.product.category,
            averageRating: item.product.averageRating,
            ratings: item.product.ratings,
            seller: item.product.seller,
          },
          quantity: item.quantity,
          price: item.price,
          isRental: item.isRental,
          total: item.total,
          subTotal: item.quantity * item.price,
        })),
        total: cart.total,
        itemCount: cart.items.length,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      };

      // Calculate additional cart statistics
      const cartStats = {
        totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        uniqueItems: cart.items.length,
        hasRentalItems: cart.items.some((item) => item.isRental),
        hasPurchaseItems: cart.items.some((item) => !item.isRental),
      };

      console.log("Cart fetched successfully:", {
        cartId: cart._id,
        itemCount: cart.items.length,
        total: cart.total,
      });

      res.status(200).json({
        success: true,
        cart: transformedCart,
        cartStats,
        message: "Cart fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching cart",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;

      // Validate quantity
      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity. Must be greater than 0",
        });
      }

      // Find cart
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      // Find cart item
      const itemIndex = cart.items.findIndex(
        (item) => item._id.toString() === itemId
      );

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        });
      }

      // Get product to check stock
      const product = await Product.findById(cart.items[itemIndex].product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`,
        });
      }

      // Update quantity and recalculate totals
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].total = cart.items[itemIndex].price * quantity;

      // Recalculate cart total
      cart.total = cart.items.reduce((sum, item) => sum + item.total, 0);

      await cart.save();

      // Get updated cart with populated product details
      const updatedCart = await Cart.findById(cart._id)
        .populate({
          path: "items.product",
          select:
            "name description image price rentPrice productType stock category averageRating ratings seller",
          populate: {
            path: "seller",
            select: "name email",
          },
        })
        .populate({
          path: "user",
          select: "name email",
        });

      // Transform cart data
      const transformedCart = {
        _id: updatedCart._id,
        user: updatedCart.user,
        items: updatedCart.items.map((item) => ({
          _id: item._id,
          product: {
            _id: item.product._id,
            name: item.product.name,
            description: item.product.description,
            image: item.product.image,
            price: item.product.price,
            rentPrice: item.product.rentPrice,
            productType: item.product.productType,
            stock: item.product.stock,
            category: item.product.category,
            averageRating: item.product.averageRating,
            ratings: item.product.ratings,
            seller: item.product.seller,
          },
          quantity: item.quantity,
          price: item.price,
          isRental: item.isRental,
          total: item.total,
          subTotal: item.quantity * item.price,
        })),
        total: updatedCart.total,
        itemCount: updatedCart.items.length,
        createdAt: updatedCart.createdAt,
        updatedAt: updatedCart.updatedAt,
      };

      // Calculate cart statistics
      const cartStats = {
        totalItems: updatedCart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        uniqueItems: updatedCart.items.length,
        hasRentalItems: updatedCart.items.some((item) => item.isRental),
        hasPurchaseItems: updatedCart.items.some((item) => !item.isRental),
      };

      res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        cart: transformedCart,
        cartStats,
      });
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({
        success: false,
        message: "Error updating cart",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const { itemId } = req.params;
      const userId = req.user.id;

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

      // Recalculate cart total
      cart.total = cart.items.reduce((sum, item) => sum + item.total, 0);

      await cart.save();

      const updatedCart = await Cart.findById(cart._id).populate({
        path: "items.product",
        select: "name image price rentPrice productType stock",
      });

      res.status(200).json({
        success: true,
        message: "Item removed from cart successfully",
        cart: updatedCart,
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({
        success: false,
        message: "Error removing from cart",
        error: error.message,
      });
    }
  },

  // Clear cart
  clearCart: async (req, res) => {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      cart.items = [];
      cart.total = 0;
      await cart.save();

      res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        cart,
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({
        success: false,
        message: "Error clearing cart",
        error: error.message,
      });
    }
  },
};

module.exports = { orderController };
