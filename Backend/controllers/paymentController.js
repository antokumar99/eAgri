const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Rental = require("../models/Rental");
const Product = require("../models/Product");
const SSLCommerzPayment = require("sslcommerz-lts");
const { BACKEND_URL, sslcommerz, pricing } = require("../config/appConfig");
const {
  OrderError,
  priceCartItems,
  reserveStock,
  releaseStock,
} = require("../utils/orderUtils");

const { storeId, storePassword, isLive } = sslcommerz;

const gateway = () => new SSLCommerzPayment(storeId, storePassword, isLive);

/**
 * The gateway posts back to these URLs from its own servers and also redirects
 * the shopper's browser to them, so they must be publicly reachable and must
 * NOT sit behind the JWT middleware — SSLCommerz has no bearer token.
 * Trust is established by validating val_id against SSLCommerz instead.
 */
const callbackUrl = (path) => `${BACKEND_URL}/payment/${path}`;

const resultUrl = (status, doc, kind = "order") =>
  `${BACKEND_URL}/payment/result?status=${status}&kind=${kind}&orderId=${
    doc._id
  }&tranId=${doc.transactionId || ""}`;

/** SSLCommerz posts urlencoded bodies; the app may send JSON. Accept either. */
const readCallbackField = (req, name) =>
  (req.body && req.body[name]) || (req.query && req.query[name]);

/**
 * Orders and rentals both check out through the same gateway, so the callback
 * has to work out which one it is looking at. The tran_id prefix carries that:
 * EAGRI_ for product orders, EAGRIR_ for rentals.
 */
const findPayableForCallback = async (req) => {
  const tranId = readCallbackField(req, "tran_id");
  const docId =
    readCallbackField(req, "value_a") || readCallbackField(req, "orderId");
  const isRental = String(tranId || "").startsWith("EAGRIR_");

  if (tranId) {
    const doc = isRental
      ? await Rental.findOne({ transactionId: tranId })
      : await Order.findOne({ transactionId: tranId });
    if (doc) return { kind: isRental ? "rental" : "order", doc };
  }

  if (docId && /^[0-9a-fA-F]{24}$/.test(String(docId))) {
    const order = await Order.findById(docId);
    if (order) return { kind: "order", doc: order };

    const rental = await Rental.findById(docId);
    if (rental) return { kind: "rental", doc: rental };
  }

  return null;
};

/** Restores reserved stock exactly once, however many callbacks arrive. */
const releaseOrderStock = async (order) => {
  if (order.stockReleased) return;
  await releaseStock(order.products);
  order.stockReleased = true;
};

// Orders and rentals spell their payment states differently ("Paid" vs "paid").
// These adapters keep the shared callback handlers free of that detail.
const isPaid = (kind, doc) =>
  kind === "rental" ? doc.paymentStatus === "paid" : doc.paymentStatus === "Paid";

const markPaid = async (kind, doc, valId) => {
  doc.paymentStatus = kind === "rental" ? "paid" : "Paid";
  doc.status = kind === "rental" ? "active" : "Processing";
  doc.paidAt = new Date();
  doc.sslcommerzValId = valId;
  await doc.save();

  if (kind === "order") {
    // The cart is only emptied once money has actually changed hands.
    await Cart.findOneAndDelete({ user: doc.user });
  }
};

const markUnpaid = async (kind, doc, cancelled) => {
  if (kind === "rental") {
    doc.paymentStatus = cancelled ? "pending" : "failed";
    if (doc.status === "pending") {
      doc.status = "cancelled";
      await Product.findByIdAndUpdate(doc.product, { $inc: { stock: 1 } });
    }
  } else {
    doc.status = "Cancelled";
    doc.paymentStatus = cancelled ? "Cancelled" : "Failed";
    await releaseOrderStock(doc);
  }
  await doc.save();
};

/**
 * Confirms a transaction with SSLCommerz. A callback hitting our URL proves
 * nothing on its own — anyone can POST to it — so the val_id is exchanged for
 * the gateway's own record and the tran_id and amount are checked against what
 * we charged.
 */
const verifyWithGateway = async (valId, doc) => {
  if (!valId) return false;

  const validation = await gateway().validate({ val_id: valId });
  const amountMatches =
    Math.abs(Number(validation?.amount) - doc.totalPrice) < 1;

  const ok =
    validation &&
    ["VALID", "VALIDATED"].includes(validation.status) &&
    validation.tran_id === doc.transactionId &&
    amountMatches;

  if (!ok) {
    console.warn("Rejected payment validation for", String(doc._id), {
      status: validation?.status,
      tranId: validation?.tran_id,
      amount: validation?.amount,
      expected: doc.totalPrice,
    });
  }

  return Boolean(ok);
};

const renderResultPage = (res, status, message) => {
  const palette = {
    success: { color: "#2e7d32", icon: "&#10004;", title: "Payment Successful" },
    fail: { color: "#c62828", icon: "&#10008;", title: "Payment Failed" },
    cancel: { color: "#ef6c00", icon: "&#8998;", title: "Payment Cancelled" },
  };
  const theme = palette[status] || palette.fail;

  res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${theme.title}</title>
    <style>
      body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;
             display: flex; align-items: center; justify-content: center;
             min-height: 100vh; margin: 0; background: #f5f7fa; }
      .card { text-align: center; padding: 40px 32px; background: #fff;
              border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.08);
              max-width: 360px; }
      .icon { font-size: 56px; color: ${theme.color}; line-height: 1; }
      h1 { color: ${theme.color}; font-size: 22px; margin: 16px 0 8px; }
      p { color: #666; font-size: 15px; margin: 0; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">${theme.icon}</div>
      <h1>${theme.title}</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`);
};

const paymentController = {
  /**
   * Creates the order and opens an SSLCommerz session.
   *
   * Order of operations matters here: the previous version decremented stock
   * and deleted the cart before it knew whether a session could even be
   * created, so a gateway outage silently destroyed both. Stock is now taken
   * only after the gateway hands back a URL, and the cart survives until the
   * payment is actually confirmed.
   */
  createPayment: async (req, res) => {
    let reserved = null;
    let order = null;

    try {
      if (!storeId || !storePassword) {
        return res.status(503).json({
          success: false,
          message:
            "Online payment is not configured. Set STORE_ID and STORE_PASSWD.",
        });
      }

      const { address, cartItems } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const required = ["street", "city", "state", "zipCode", "phone"];
      const missing = required.filter((f) => !address || !address[f]);
      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Missing address fields: ${missing.join(", ")}`,
        });
      }

      const priced = await priceCartItems(cartItems, {
        paymentMethod: "Online Payment",
      });

      order = new Order({
        user: userId,
        products: priced.lineItems,
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        codFee: 0,
        totalPrice: priced.total,
        paymentMethod: "Online Payment",
        status: "Pending",
        paymentStatus: "Pending",
        shippingAddress: address,
      });

      order.transactionId = `EAGRI_${order._id}_${Date.now()}`;
      await order.save();

      const data = {
        total_amount: priced.total,
        currency: pricing.currency,
        tran_id: order.transactionId,
        success_url: callbackUrl("success"),
        fail_url: callbackUrl("fail"),
        cancel_url: callbackUrl("cancel"),
        ipn_url: callbackUrl("ipn"),
        shipping_method: "Courier",
        product_name: "eAgri Products",
        product_category: "Agriculture",
        product_profile: "agriculture",
        cus_name: user.name,
        cus_email: user.email,
        cus_add1: address.street,
        cus_city: address.city,
        cus_state: address.state,
        cus_postcode: address.zipCode,
        cus_country: "Bangladesh",
        cus_phone: address.phone,
        ship_name: user.name,
        ship_add1: address.street,
        ship_city: address.city,
        ship_state: address.state,
        ship_postcode: address.zipCode,
        ship_country: "Bangladesh",
        value_a: order._id.toString(),
        value_b: userId.toString(),
      };

      const apiResponse = await gateway().init(data);

      if (!apiResponse || !apiResponse.GatewayPageURL) {
        await Order.findByIdAndDelete(order._id);
        console.error("SSLCommerz init returned no GatewayPageURL:", apiResponse);
        return res.status(502).json({
          success: false,
          message:
            apiResponse?.failedreason ||
            "Payment gateway did not return a checkout URL",
        });
      }

      reserved = await reserveStock(priced.lineItems);

      return res.status(200).json({
        success: true,
        message: "Payment session created successfully",
        paymentUrl: apiResponse.GatewayPageURL,
        orderId: order._id,
        transactionId: order.transactionId,
        amount: priced.total,
        breakdown: {
          subtotal: priced.subtotal,
          deliveryFee: priced.deliveryFee,
        },
      });
    } catch (error) {
      if (reserved) await releaseStock(reserved).catch(() => {});
      if (order?._id) await Order.findByIdAndDelete(order._id).catch(() => {});

      if (error instanceof OrderError) {
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      }

      console.error("Error creating payment:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to start payment" });
    }
  },

  /**
   * SSLCommerz success callback. A POST to this URL proves nothing on its own —
   * anyone can send one — so the transaction is confirmed by calling back to
   * SSLCommerz with val_id and checking that the amount and tran_id match the
   * order we created.
   */
  paymentSuccess: async (req, res) => {
    try {
      const found = await findPayableForCallback(req);
      if (!found) {
        return renderResultPage(res, "fail", "We could not find this payment.");
      }

      const { kind, doc } = found;

      if (isPaid(kind, doc)) {
        return res.redirect(resultUrl("success", doc, kind));
      }

      const valId = readCallbackField(req, "val_id");
      const verified = await verifyWithGateway(valId, doc);

      if (!verified) {
        await markUnpaid(kind, doc, false);
        return res.redirect(resultUrl("fail", doc, kind));
      }

      await markPaid(kind, doc, valId);
      return res.redirect(resultUrl("success", doc, kind));
    } catch (error) {
      console.error("Error handling payment success:", error);
      return renderResultPage(
        res,
        "fail",
        "We could not confirm your payment. Please check My Orders."
      );
    }
  },

  paymentFailure: async (req, res) => {
    try {
      const found = await findPayableForCallback(req);
      if (!found) {
        return renderResultPage(res, "fail", "Your payment was not completed.");
      }

      const { kind, doc } = found;
      if (!isPaid(kind, doc)) await markUnpaid(kind, doc, false);

      return res.redirect(resultUrl("fail", doc, kind));
    } catch (error) {
      console.error("Error handling payment failure:", error);
      return renderResultPage(res, "fail", "Your payment was not completed.");
    }
  },

  paymentCancel: async (req, res) => {
    try {
      const found = await findPayableForCallback(req);
      if (!found) {
        return renderResultPage(res, "cancel", "Your payment was cancelled.");
      }

      const { kind, doc } = found;
      if (!isPaid(kind, doc)) await markUnpaid(kind, doc, true);

      return res.redirect(resultUrl("cancel", doc, kind));
    } catch (error) {
      console.error("Error handling payment cancellation:", error);
      return renderResultPage(res, "cancel", "Your payment was cancelled.");
    }
  },

  /**
   * Landing page the WebView watches for. Purely cosmetic — the app confirms
   * the real outcome through GET /payment/status/:orderId.
   */
  paymentResult: (req, res) => {
    const status = ["success", "fail", "cancel"].includes(req.query.status)
      ? req.query.status
      : "fail";

    const messages = {
      success: "Your order has been confirmed. You can close this window.",
      fail: "Your payment was not completed. No money has been taken.",
      cancel: "You cancelled the payment. Your cart is still saved.",
    };

    return renderResultPage(res, status, messages[status]);
  },

  /**
   * Server-to-server notification. Runs the same validation as the browser
   * callback, because the shopper's browser may never reach success_url.
   */
  paymentIPN: async (req, res) => {
    try {
      const found = await findPayableForCallback(req);
      if (!found) {
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }

      const { kind, doc } = found;
      const status = readCallbackField(req, "status");
      const valId = readCallbackField(req, "val_id");

      if (status === "VALID" && !isPaid(kind, doc)) {
        if (await verifyWithGateway(valId, doc)) {
          await markPaid(kind, doc, valId);
        }
      } else if (
        ["FAILED", "CANCELLED", "EXPIRED", "UNATTEMPTED"].includes(status) &&
        !isPaid(kind, doc)
      ) {
        await markUnpaid(kind, doc, status === "CANCELLED");
      }

      return res.status(200).json({ success: true, message: "IPN processed" });
    } catch (error) {
      console.error("Error processing IPN:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error processing IPN" });
    }
  },

  /**
   * Opens a gateway session for an existing rental. Rentals were created with
   * paymentMethod "online" but nothing ever charged for them, so every rental
   * sat at paymentStatus "pending" forever.
   */
  createRentalPayment: async (req, res) => {
    try {
      if (!storeId || !storePassword) {
        return res.status(503).json({
          success: false,
          message:
            "Online payment is not configured. Set STORE_ID and STORE_PASSWD.",
        });
      }

      const rental = await Rental.findById(req.params.rentalId).populate(
        "product",
        "name category"
      );

      if (!rental) {
        return res
          .status(404)
          .json({ success: false, message: "Rental not found" });
      }

      if (rental.user.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized to pay for this rental" });
      }

      if (rental.paymentStatus === "paid") {
        return res
          .status(400)
          .json({ success: false, message: "This rental is already paid" });
      }

      if (rental.status === "cancelled" || rental.status === "completed") {
        return res.status(400).json({
          success: false,
          message: `Cannot pay for a ${rental.status} rental`,
        });
      }

      const user = await User.findById(req.user.id);
      const address = rental.shippingAddress || {};

      rental.transactionId = `EAGRIR_${rental._id}_${Date.now()}`;
      await rental.save();

      const apiResponse = await gateway().init({
        total_amount: rental.totalPrice,
        currency: pricing.currency,
        tran_id: rental.transactionId,
        success_url: callbackUrl("success"),
        fail_url: callbackUrl("fail"),
        cancel_url: callbackUrl("cancel"),
        ipn_url: callbackUrl("ipn"),
        shipping_method: "Courier",
        product_name: `Rental: ${rental.product?.name || "eAgri equipment"}`,
        product_category: rental.product?.category || "Agriculture",
        product_profile: "agriculture",
        cus_name: user?.name,
        cus_email: user?.email,
        cus_add1: address.street || user?.address?.street || "N/A",
        cus_city: address.city || user?.address?.city || "Dhaka",
        cus_state: address.state || user?.address?.country || "Dhaka",
        cus_postcode: address.zipCode || user?.address?.postalCode || "1000",
        cus_country: "Bangladesh",
        cus_phone: user?.phone,
        ship_name: user?.name,
        ship_add1: address.street || "N/A",
        ship_city: address.city || "Dhaka",
        ship_state: address.state || "Dhaka",
        ship_postcode: address.zipCode || "1000",
        ship_country: "Bangladesh",
        value_a: rental._id.toString(),
        value_b: req.user.id,
      });

      if (!apiResponse || !apiResponse.GatewayPageURL) {
        console.error("SSLCommerz rental init failed:", apiResponse);
        return res.status(502).json({
          success: false,
          message:
            apiResponse?.failedreason ||
            "Payment gateway did not return a checkout URL",
        });
      }

      return res.status(200).json({
        success: true,
        paymentUrl: apiResponse.GatewayPageURL,
        rentalId: rental._id,
        orderId: rental._id, // PaymentWebView polls this id
        transactionId: rental.transactionId,
        amount: rental.totalPrice,
      });
    } catch (error) {
      console.error("Error creating rental payment:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to start rental payment" });
    }
  },

  /**
   * Authenticated read of the true payment state. The app calls this after the
   * WebView closes instead of trusting the redirect URL it happened to land on.
   */
  getPaymentStatus: async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId).populate({
        path: "products.product",
        select: "name image price",
      });

      // The same endpoint serves rentals so the payment screen has one place
      // to confirm an outcome regardless of what was bought.
      const doc = order || (await Rental.findById(orderId).populate("product", "name image"));

      if (!doc) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      if (doc.user.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized to view this order" });
      }

      // Normalise the rental's lowercase states so the client has one vocabulary.
      const paymentStatus = order
        ? doc.paymentStatus
        : { paid: "Paid", pending: "Pending", failed: "Failed", refunded: "Refunded" }[
            doc.paymentStatus
          ] || "Pending";

      return res.status(200).json({
        success: true,
        kind: order ? "order" : "rental",
        orderId: doc._id,
        status: doc.status,
        paymentStatus,
        transactionId: doc.transactionId,
        totalPrice: doc.totalPrice,
        paidAt: doc.paidAt,
        order: doc,
      });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching payment status" });
    }
  },
};

module.exports = { paymentController };
