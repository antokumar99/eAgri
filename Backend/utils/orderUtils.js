const mongoose = require("mongoose");
const Product = require("../models/Product");
const { pricing } = require("../config/appConfig");

/**
 * The app sends cart items straight from GET /cart, where `product` is a
 * populated object. Older callers send a bare id string. Accept both.
 */
const extractProductId = (item) => {
  const raw = item && item.product !== undefined ? item.product : item;
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (raw._id) return String(raw._id);
  return String(raw);
};

class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Validates a cart payload against the database and prices it server-side.
 * Prices always come from the Product documents, never from the request body,
 * so a tampered client cannot buy a tractor for one taka.
 */
const priceCartItems = async (cartItems, { paymentMethod } = {}) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new OrderError(400, "Cart is empty");
  }

  // Merge duplicate lines for the same product so stock checks are accurate.
  const merged = new Map();
  for (const item of cartItems) {
    const productId = extractProductId(item);
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new OrderError(400, "Cart contains an invalid product reference");
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new OrderError(400, "Cart contains an invalid quantity");
    }

    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] } });
  const productsById = new Map(products.map((p) => [String(p._id), p]));

  const lineItems = [];
  let subtotal = 0;

  for (const [productId, quantity] of merged) {
    const product = productsById.get(productId);
    if (!product) {
      throw new OrderError(404, "A product in your cart is no longer available");
    }

    if (product.productType === "rent") {
      throw new OrderError(
        400,
        `${product.name} is rent-only and cannot be purchased`
      );
    }

    if (typeof product.price !== "number" || product.price <= 0) {
      throw new OrderError(400, `${product.name} has no valid sale price`);
    }

    if (product.stock < quantity) {
      throw new OrderError(
        400,
        `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${quantity}`
      );
    }

    subtotal += product.price * quantity;
    lineItems.push({ product: product._id, quantity, price: product.price });
  }

  const deliveryFee = pricing.deliveryFee;
  const codFee = paymentMethod === "Cash on Delivery" ? pricing.codFee : 0;

  return {
    lineItems,
    subtotal,
    deliveryFee,
    codFee,
    total: subtotal + deliveryFee + codFee,
  };
};

/**
 * Conditional decrement: the `stock: { $gte: quantity }` guard makes each
 * update atomic, so two shoppers checking out at once cannot oversell.
 * Any failure rolls back the lines already taken.
 */
const reserveStock = async (lineItems) => {
  const reserved = [];

  for (const item of lineItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!updated) {
      await releaseStock(reserved);
      throw new OrderError(409, "An item in your cart just went out of stock");
    }

    reserved.push(item);
  }

  return reserved;
};

const releaseStock = async (lineItems) => {
  await Promise.all(
    (lineItems || []).map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      })
    )
  );
};

module.exports = {
  OrderError,
  extractProductId,
  priceCartItems,
  reserveStock,
  releaseStock,
};
