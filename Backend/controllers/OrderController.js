const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");

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

  // Create order for Cash on Delivery
  createOrder: async (req, res) => {
    try {
      const { address, total, cartItems, paymentMethod } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Validate stock availability before creating order
      for (const item of cartItems) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product ${item.product} not found`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          });
        }
      }

      const orderProducts = cartItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      }));

      const order = new Order({
        user: userId,
        products: orderProducts,
        totalPrice: total,
        paymentMethod: paymentMethod,
        status: "Pending",
        paymentStatus: "Pending",
        shippingAddress: address,
        transactionId: `COD_${Date.now()}_${userId}`,
      });

      await order.save();

      // Reduce stock for each product in the order
      for (const item of cartItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }

      // Clear user's cart
      await Cart.findOneAndDelete({ user: userId });

      return res.status(200).json({
        success: true,
        message: "Order created successfully",
        orderId: order._id,
        order: order,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Get user's orders (orders placed by the user)
  getUserOrders: async (req, res) => {
    try {
      const userId = req.user.id;

      const orders = await Order.find({ user: userId })
        .populate({
          path: "products.product",
          select:
            "name description image price rentPrice productType stock category seller",
          populate: {
            path: "seller",
            select: "name email phone",
          },
        })
        .populate({
          path: "user",
          select: "name email phone",
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
        orders: orders,
      });
    } catch (error) {
      console.error("Error getting user orders:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Get received orders (orders where user is the seller)
  getReceivedOrders: async (req, res) => {
    try {
      const userId = req.user.id;

      // Find orders where the user is the seller of any product
      const orders = await Order.find({
        "products.product": {
          $in: await Product.find({ seller: userId }).distinct("_id"),
        },
      })
        .populate({
          path: "products.product",
          select:
            "name description image price rentPrice productType stock category seller",
          populate: {
            path: "seller",
            select: "name email phone",
          },
        })
        .populate({
          path: "user",
          select: "name email phone",
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Received orders retrieved successfully",
        orders: orders,
      });
    } catch (error) {
      console.error("Error getting received orders:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Get order by ID
  getOrderById: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findById(orderId)
        .populate({
          path: "products.product",
          select:
            "name description image price rentPrice productType stock category seller",
          populate: {
            path: "seller",
            select: "name email phone",
          },
        })
        .populate({
          path: "user",
          select: "name email phone",
        });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if user is authorized to view this order
      if (order.user._id.toString() !== userId) {
        // Check if user is the seller of any product in the order
        const isSeller = order.products.some(
          (item) => item.product.seller._id.toString() === userId
        );

        if (!isSeller) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view this order",
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Order retrieved successfully",
        order: order,
      });
    } catch (error) {
      console.error("Error getting order by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Update order status (for sellers)
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if user is the seller of any product in the order
      const isSeller = order.products.some(
        (item) => item.product.seller.toString() === userId
      );

      if (!isSeller) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this order",
        });
      }

      const previousStatus = order.status;
      order.status = status;
      await order.save();

      // If order is being cancelled, restore stock
      if (status === "Cancelled" && previousStatus !== "Cancelled") {
        for (const item of order.products) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { new: true }
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order: order,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};

module.exports = { orderController };
