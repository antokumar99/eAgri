const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Product = require("../models/Product");
const SSLCommerzPayment = require("sslcommerz-lts");

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWD;
const is_live = false;

const paymentController = {
  createPayment: async (req, res) => {
    try {
      const { address, total, cartItems } = req.body;
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
        paymentMethod: "Online Payment",
        status: "Pending",
        shippingAddress: address,
      });

      await order.save();
      console.log("Order created:", order._id);

      // Update order with transaction ID
      order.transactionId = `TEST_${order._id}_${Date.now()}`;
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

      const data = {
        total_amount: total,
        currency: "BDT",
        tran_id: `ORDER_${order._id}_${Date.now()}`,
        success_url: "http://localhost:3000/payment/success",
        fail_url: "http://localhost:3000/payment/fail",
        cancel_url: "http://localhost:3000/payment/cancel",
        ipn_url: "http://localhost:3000/payment/ipn",
        shipping_method: "Courier",
        product_name: "eAgri Products",
        product_category: "Agriculture",
        product_profile: "agriculture",
        cus_name: user.name,
        cus_email: user.email,
        cus_add1: address.street,
        cus_add2: address.street,
        cus_city: address.city,
        cus_state: address.state,
        cus_postcode: address.zipCode,
        cus_country: "Bangladesh",
        cus_phone: address.phone,
        cus_fax: address.phone,
        ship_name: user.name,
        ship_add1: address.street,
        ship_add2: address.street,
        ship_city: address.city,
        ship_state: address.state,
        ship_postcode: address.zipCode,
        ship_country: "Bangladesh",
        value_a: order._id.toString(), // Order ID
        value_b: userId.toString(), // User ID
        value_c: JSON.stringify(cartItems), // Cart items
        value_d: JSON.stringify(address), // Shipping address
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

      try {
        const apiResponse = await sslcz.init(data);
        console.log("SSLCommerz API Response:", apiResponse);

        if (apiResponse && apiResponse.GatewayPageURL) {
          let GatewayPageURL = apiResponse.GatewayPageURL;

          console.log(GatewayPageURL);

          // Update order with transaction ID
          order.transactionId = data.tran_id;
          await order.save();

          // Clear user's cart
          await Cart.findOneAndDelete({ user: userId });

          return res.status(200).json({
            success: true,
            message: "Payment session created successfully",
            paymentUrl: GatewayPageURL,
            orderId: order._id,
            transactionId: data.tran_id,
          });
        } else {
          console.error(
            "SSLCommerz response missing GatewayPageURL:",
            apiResponse
          );
          return res.status(500).json({
            success: false,
            message: "SSLCommerz response invalid",
            error: "No GatewayPageURL in response",
            response: apiResponse,
          });
        }
      } catch (sslError) {
        console.error("SSLCommerz init error:", sslError);
        return res.status(500).json({
          success: false,
          message: "SSLCommerz payment init failed",
          error: sslError.message,
          details: sslError,
        });
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Handle payment success
  paymentSuccess: async (req, res) => {
    try {
      const { orderId, transactionId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Update order status
      order.status = "Processing";
      order.paymentStatus = "Paid";
      order.paidAt = new Date();
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Payment successful",
        order: order,
      });
    } catch (error) {
      console.error("Error handling payment success:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Handle payment failure
  paymentFailure: async (req, res) => {
    try {
      const { orderId } = req.body;

      const order = await Order.findById(orderId);
      if (order) {
        order.status = "Cancelled";
        order.paymentStatus = "Failed";
        await order.save();

        // Restore stock when payment fails
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
        message: "Payment failure handled",
      });
    } catch (error) {
      console.error("Error handling payment failure:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Handle payment cancellation
  paymentCancel: async (req, res) => {
    try {
      const { orderId } = req.body;

      const order = await Order.findById(orderId);
      if (order) {
        order.status = "Cancelled";
        order.paymentStatus = "Cancelled";
        await order.save();

        // Restore stock when payment is cancelled
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
        message: "Payment cancelled",
      });
    } catch (error) {
      console.error("Error handling payment cancellation:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // IPN (Instant Payment Notification) handler
  paymentIPN: async (req, res) => {
    try {
      const {
        tran_id,
        status,
        val_id,
        amount,
        currency,
        cus_name,
        cus_email,
        cus_add1,
        cus_city,
        cus_postcode,
        cus_country,
        cus_phone,
        ship_name,
        ship_add1,
        ship_city,
        ship_postcode,
        ship_country,
        value_a, // Order ID
        value_b, // User ID
        value_c, // Cart items
        value_d, // Shipping address
      } = req.body;

      // Verify the transaction
      const order = await Order.findById(value_a);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const previousStatus = order.status;

      // Update order based on payment status
      if (status === "VALID") {
        order.status = "Processing";
        order.paymentStatus = "Paid";
        order.paidAt = new Date();
        order.sslcommerzValId = val_id;
      } else if (status === "FAILED") {
        order.status = "Cancelled";
        order.paymentStatus = "Failed";
      } else if (status === "CANCELLED") {
        order.status = "Cancelled";
        order.paymentStatus = "Cancelled";
      }

      await order.save();

      // Restore stock if payment failed or was cancelled
      if (
        (status === "FAILED" || status === "CANCELLED") &&
        previousStatus !== "Cancelled"
      ) {
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
        message: "IPN processed successfully",
      });
    } catch (error) {
      console.error("Error processing IPN:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};

module.exports = { paymentController };
