# Chat setup (Firestore)

Messaging runs on Cloud Firestore in the `reactn-test` Firebase project. If the
Messages tab shows **"Chat unavailable"**, or the console logs
`FirebaseError: Missing or insufficient permissions`, the project's security
rules are rejecting the app.

This is the most likely state of a project created a while ago: Firestore
"test mode" rules expire ~30 days after creation and then deny everything.

## Fix

1. Open the [Firebase console](https://console.firebase.google.com/) → project
   **reactn-test** → **Firestore Database** → **Rules**.
2. Replace the contents with the rules below and click **Publish**.
3. Pull to refresh the Messages tab.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // The app authenticates against its own Express API with a JWT and does
    // not sign in to Firebase, so request.auth is always null here. These
    // rules therefore cannot identify the caller — they only constrain the
    // shape of what can be written. See "Hardening" below.

    match /users/{userId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasOnly(
        ['userId', 'username', 'email', 'isOnline', 'lastSeen', 'avatar']
      );
    }

    match /chats/{chatId} {
      allow read: if true;
      allow create, update: if request.resource.data.participantIds is list
                            && request.resource.data.participantIds.size() == 2;
      allow delete: if false;
    }

    match /messages/{messageId} {
      allow read: if true;
      allow create: if request.resource.data.text is string
                    && request.resource.data.text.size() > 0
                    && request.resource.data.text.size() <= 1000
                    && request.resource.data.chatId is string
                    && request.resource.data.senderId is string;
      // Only the read receipt / delivery flags may be flipped afterwards.
      allow update: if request.resource.data.diff(resource.data)
                      .affectedKeys()
                      .hasOnly(['isRead', 'sent', 'delivered']);
      allow delete: if false;
    }
  }
}
```

## What these rules do and don't do

They let the app work and stop obviously malformed writes, but **they do not
authenticate anyone**. Any client with the project's config — which ships inside
the app bundle and is in `eAgri/services/firebase.js` — can read every chat and
post messages as any user id.

That is acceptable for a demo or coursework project. It is not acceptable if
real people will use this.

## Hardening (if this goes to real users)

The root problem is that the app has two identity systems: a JWT from the
Express API, and Firebase, which knows nothing about it. Close the gap with
custom tokens:

1. Add the Firebase Admin SDK to the backend.
2. On login, call `admin.auth().createCustomToken(user._id)` and return it
   alongside the JWT.
3. In the app, `signInWithCustomToken(auth, customToken)` after login.
4. Then `request.auth.uid` is the MongoDB user id inside rules, and you can
   write real ownership checks:

```
match /messages/{messageId} {
  allow create: if request.auth != null
                && request.auth.uid == request.resource.data.senderId;
}

match /chats/{chatId} {
  allow read, write: if request.auth != null
                     && request.auth.uid in resource.data.participantIds;
}
```

Note that `eAgri/services/firebase.js` no longer initialises Firebase Auth — it
was removed because it crashed on launch and nothing used it. Re-add
`getAuth(app)` there when you implement the above.
