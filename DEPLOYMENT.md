# Deploying eAgri

Two separate deployments: the Express API goes to a host, the app is built with
EAS and installed on phones. The API must be live first — the app is built with
its URL baked in.

---

## Blockers to clear first

These are broken today. The app runs locally in spite of them; a real
deployment will not.

| Problem | Effect if ignored | Fix |
| --- | --- | --- |
| Gmail app password is rejected (`535-5.7.8`) | Nobody can verify an account. `AUTO_VERIFY_USERS` is force-disabled when `NODE_ENV=production`, so **signup is unusable** | New app password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |
| Firestore rules deny everything | Messaging silently dead | Publish the rules in [FIREBASE-CHAT-SETUP.md](FIREBASE-CHAT-SETUP.md) |
| Cloudinary secret was public in git | Anyone can upload/delete on your account | Rotate in the Cloudinary console |
| MongoDB password + JWT secret were public in git | Full database access; forged logins | Rotate both |
| SSLCommerz is sandbox (`IS_LIVE=false`) | No real money moves | Apply for merchant credentials |

Rotating the JWT secret logs everyone out. Do it before you have users.

---

## 1. Database

MongoDB Atlas free tier is fine to start.

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a user with a fresh password.
3. **Network Access** → add `0.0.0.0/0`. Hosting providers do not offer static
   egress IPs on free plans, so allow-listing a single address will not work.
4. Copy the connection string; append `/eagri` for the database name.

---

## 2. API

Any Node host works. Render is used below because it has a free tier and gives
you HTTPS, which SSLCommerz requires for live payments.

**Render** → New → Web Service → connect `antokumar99/eAgri`:

| Setting | Value |
| --- | --- |
| Root Directory | `Backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Then add environment variables. `Backend/.env` is gitignored, so **nothing is
deployed automatically** — every value must be set in the dashboard:

```
MONGO_URI=<your new Atlas string>
JWT_SECRET=<new: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NODE_ENV=production
BACKEND_URL=https://<your-service>.onrender.com
FRONTEND_URL=https://<your-service>.onrender.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=<rotated>
EMAIL_USERNAME=you@gmail.com
EMAIL_PASSWORD=<new app password>
STORE_ID=...
STORE_PASSWD=...
IS_LIVE=false
```

`BACKEND_URL` must be the real public URL. It builds the SSLCommerz callback
URLs and the links in verification emails; the LAN auto-detection that works
locally resolves to a private address that nothing outside can reach.

Do **not** set `AUTO_VERIFY_USERS`. It is ignored when `NODE_ENV=production`
by design, so a stray `true` cannot let unverified accounts in.

Check it came up:

```bash
curl https://<your-service>.onrender.com/health
```

### Free-tier caveats

- Instances sleep after ~15 minutes idle; the next request takes 30-60s. The
  app's request timeout is 15s, so the first call after a sleep will fail.
  Either upgrade to a paid instance or raise `REQUEST_TIMEOUT` in
  `eAgri/config/apiConfig.js`.
- The filesystem is ephemeral. That is fine here: `Backend/uploads/` only holds
  a file between multer writing it and Cloudinary receiving it.

---

## 3. Payments

Local development only ever exercised the browser redirect. Two callback paths
matter in production:

- **Redirect** — the shopper's WebView returns to `BACKEND_URL/payment/success`.
  Works on a LAN, which is why it worked in testing.
- **IPN** — SSLCommerz's servers POST to `BACKEND_URL/payment/ipn` directly.
  This never worked locally because a LAN address is unreachable from their
  network. It is the safety net for a shopper who closes the app mid-payment.

Once the API is public both work. Register the IPN URL in the SSLCommerz
merchant panel, then set `IS_LIVE=true` only after live credentials are issued.

---

## 4. The app

```bash
npm install -g eas-cli
eas login
cd eAgri
eas build:configure
```

Put your API URL in `eas.json` — replace `REPLACE-ME` in the `preview` and
`production` profiles. Expo inlines `EXPO_PUBLIC_*` at build time; without it a
release build logs an error and falls back to localhost, which cannot work on a
phone.

`eAgri/config/env.js` is gitignored and holds the OpenWeatherMap key, so EAS
cloud builds will not have it. Either add `EXPO_PUBLIC_OPENWEATHER_KEY` to
`eas.json` and read it in `WeatherScreen`, or commit a non-secret placeholder.

**Test build** (installable APK, no Play Store):

```bash
eas build --platform android --profile preview
```

**Store build** (AAB):

```bash
eas build --platform android --profile production
eas submit --platform android
```

Play Store submission also needs a developer account ($25 one-off), a privacy
policy URL, screenshots (`screenshots/` has 14 already), and a feature graphic.

iOS additionally requires an Apple Developer account ($99/year) and a Mac only
if you build locally — EAS builds in the cloud.

---

## 5. Before real users

Things that are fine for coursework and not for production:

- **Firestore rules authenticate nobody.** Any client with the config in
  `eAgri/services/firebase.js` can read every conversation. The custom-token fix
  is in [FIREBASE-CHAT-SETUP.md](FIREBASE-CHAT-SETUP.md).
- **No rate limiting.** `/login` and `/register` accept unlimited attempts. Add
  `express-rate-limit`.
- **No password rules.** Any non-empty string is accepted.
- **No password reset.** The "Forgot password?" link does nothing.
- **`ALLOWED_ORIGINS` is unset**, so CORS allows every origin. Harmless for the
  mobile app, which sends a bearer token rather than cookies; set it if you add
  a web client.
- **No logging or error tracking.** Add Sentry or equivalent before you are
  debugging from user reports alone.
