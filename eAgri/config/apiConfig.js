import { NativeModules, Platform } from "react-native";

// Where the eAgri backend lives.
//
// Hardcoding a LAN IP here breaks every time the router hands out a new lease,
// which looks exactly like "I can't log in" — the app is calling an address
// that no longer exists. So in development the host is taken from the Metro
// bundler URL instead: the phone is already talking to Metro on the dev
// machine, and the backend runs on that same machine.
//
// Set API_BASE_URL_OVERRIDE below if your backend is somewhere else.

const API_PORT = 3000;

/**
 * Production API URL, baked in at build time.
 *
 * Expo inlines any EXPO_PUBLIC_* variable into the bundle, so a release build
 * gets its address from the environment rather than from Metro (which is not
 * running on an installed app). Set it in eas.json per build profile, or in a
 * .env file for local builds:
 *
 *   EXPO_PUBLIC_API_URL=https://api.your-domain.com
 *
 * Without this a release build falls back to localhost and every request fails.
 */
const API_BASE_URL_OVERRIDE = process.env.EXPO_PUBLIC_API_URL || null;

/**
 * Metro exposes its own URL through SourceCode.scriptURL, e.g.
 *   http://192.168.0.105:8081/index.bundle?platform=android&dev=true
 * The host in that URL is the dev machine as the device can reach it.
 */
function hostFromMetro() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptURL !== "string") return null;
  const match = /^https?:\/\/([^:/]+)/.exec(scriptURL);
  return match ? match[1] : null;
}

function resolveBaseUrl() {
  if (API_BASE_URL_OVERRIDE) return API_BASE_URL_OVERRIDE;

  // Running as a web build: the browser and the backend share a machine.
  if (Platform.OS === "web") {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${host}:${API_PORT}`;
  }

  const host = hostFromMetro();
  if (host) return `http://${host}:${API_PORT}`;

  // No Metro and no EXPO_PUBLIC_API_URL: this is a release build that was
  // never told where its backend lives. localhost cannot work on a phone, so
  // say so loudly rather than failing every request with a vague network error.
  console.error(
    '[eAgri] No API URL configured. Set EXPO_PUBLIC_API_URL before building a ' +
      'release, e.g. EXPO_PUBLIC_API_URL=https://api.your-domain.com'
  );
  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

// How long to wait on a normal request before giving up.
export const REQUEST_TIMEOUT = 15000;

// Uploads carry image payloads and need a longer budget.
export const UPLOAD_TIMEOUT = 60000;

// Logged once at startup so the address in use is visible when a request fails.
console.log("[eAgri] API base URL:", API_BASE_URL);

export default { API_BASE_URL, REQUEST_TIMEOUT, UPLOAD_TIMEOUT };
