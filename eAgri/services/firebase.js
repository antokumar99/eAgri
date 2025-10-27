import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {

  apiKey: "AIzaSyBOhSWw48uvo68b6QLpn_p0M8UPQqb8L0w",

  authDomain: "reactn-test.firebaseapp.com",

  projectId: "reactn-test",

  storageBucket: "reactn-test.firebasestorage.app",

  messagingSenderId: "448719252260",

  appId: "1:448719252260:web:07ae514645a52e5c4321b1",

  measurementId: "G-3BLL1N9S06"

};



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// For development - uncomment these if you want to use Firebase emulators
// if (__DEV__) {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     connectAuthEmulator(auth, 'http://localhost:9099');
//   } catch (error) {
//     console.log('Emulator connection error:', error);
//   }
// }

export default app;