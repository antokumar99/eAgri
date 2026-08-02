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

/** Manual override. Leave null to auto-detect. e.g. "http://10.0.0.7:3000" */
const API_BASE_URL_OVERRIDE = null;

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

  // Release builds have no Metro. Point this at your deployed API.
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
