// Where the eAgri backend lives.
//
// This is deliberately kept out of config/env.js (which is gitignored for API
// keys) so a fresh clone still runs. It holds no secrets — just an address.
//
// A physical device cannot reach "localhost", so during development set this to
// the LAN IP of the machine running the backend, e.g. http://192.168.0.103:3000.
// The Android emulator uses http://10.0.2.2:3000.
export const API_BASE_URL = "http://192.168.0.103:3000";

// How long to wait on a normal request before giving up.
export const REQUEST_TIMEOUT = 15000;

// Uploads carry image payloads and need a longer budget.
export const UPLOAD_TIMEOUT = 60000;

export default { API_BASE_URL, REQUEST_TIMEOUT, UPLOAD_TIMEOUT };
