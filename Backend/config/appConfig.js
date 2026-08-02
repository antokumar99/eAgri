require("dotenv").config();
const os = require("os");

const stripTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const PORT = process.env.PORT || 3000;

/** First non-internal IPv4 address, i.e. how other devices on the Wi-Fi see us. */
const detectLanIp = () => {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const addr of addresses || []) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return "localhost";
};

const LAN_IP = detectLanIp();

// Public base URL of this API. SSLCommerz calls back to these URLs from its own
// servers, and the app opens verification links from a phone, so "localhost"
// is wrong in both cases.
//
// A hardcoded LAN IP goes stale the moment the router issues a new lease, which
// is why this now falls back to detecting the current address rather than a
// fixed string. For a real sandbox/live SSLCommerz integration, set BACKEND_URL
// explicitly to a publicly reachable URL.
const BACKEND_URL =
  stripTrailingSlash(process.env.BACKEND_URL) || `http://${LAN_IP}:${PORT}`;

module.exports = {
  PORT,
  LAN_IP,
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
