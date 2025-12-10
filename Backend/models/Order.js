const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Cancelled", "Refunded"],
    default: "Pending",
  },
  paymentMethod: {
    type: String,
    enum: ["Cash on Delivery", "Online Payment"],
    required: true,
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  codFee: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    phone: String,
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  sslcommerzValId: {
    type: String,
  },
  paidAt: {
    type: Date,
  },
  // Stock is decremented when an order is placed. This flag makes the
  // restore-on-cancel path idempotent: SSLCommerz can deliver both a browser
  // callback and an IPN for the same failure, and without it the second one
  // would credit the seller's stock a second time.
  stockReleased: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;