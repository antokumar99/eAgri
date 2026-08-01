import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase project used for the chat feature. These values identify the
// project and are safe to ship in a client — access is controlled by the
// Firestore security rules in the Firebase console, not by hiding this config.
const firebaseConfig = {
  apiKey: 'AIzaSyBOhSWw48uvo68b6QLpn_p0M8UPQqb8L0w',
  authDomain: 'reactn-test.firebaseapp.com',
  projectId: 'reactn-test',
  storageBucket: 'reactn-test.firebasestorage.app',
  messagingSenderId: '448719252260',
  appId: '1:448719252260:web:07ae514645a52e5c4321b1',
  measurementId: 'G-3BLL1N9S06',
};

const app = initializeApp(firebaseConfig);

// Firestore backs the chat. Nothing in the app uses Firebase Auth — sign-in
// runs against our own Express API and a JWT in AsyncStorage.
//
// This file used to also call:
//   initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
// but `getReactNativePersistence` was removed in firebase-js-sdk v12 (this
// project is on 12.0.0), so that line threw `getReactNativePersistence is not
// a function` while the module was still loading. Because chatService imports
// this file and MessagesScreen/ProfileScreen import chatService, the throw
// propagated all the way up to App.js and the app died on launch with a blank
// screen. The auth instance was exported but never referenced anywhere, so it
// is simply gone.
export const db = getFirestore(app);

export default app;
