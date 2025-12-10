require("dotenv").config();

const stripTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const PORT = process.env.PORT || 3000;

// Public base URL of this API. SSLCommerz calls back to these URLs from its own
// servers, so "localhost" only works when the gateway can reach this machine.
// In development with the Expo app on a phone, set BACKEND_URL to the LAN IP
// (e.g. http://192.168.0.103:3000); for a real sandbox/live integration this
// must be a publicly reachable URL.
const BACKEND_URL =
  stripTrailingSlash(process.env.BACKEND_URL) || `http://localhost:${PORT}`;

module.exports = {
  PORT,
  BACKEND_URL,
  FRONTEND_URL: stripTrailingSlash(process.env.FRONTEND_URL) || BACKEND_URL,
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  sslcommerz: {
    storeId: process.env.STORE_ID,
    storePassword: process.env.STORE_PASSWD,
    isLive: String(process.env.IS_LIVE).toLowerCase() === "true",
  },

  // Order pricing. Kept server-side so the client cannot dictate what it pays.
  pricing: {
    deliveryFee: Number(process.env.DELIVERY_FEE || 50),
    codFee: Number(process.env.COD_FEE || 30),
    currency: "BDT",
  },
};
