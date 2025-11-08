

// Reverted to actual Firebase imports and configuration.
// FIX: Updated Firebase imports to use the modular SDK (v9+).
import { initializeApp, getApps, getApp } from "firebase/app";
// FIX: `getAuth` and other authentication-related functions are correctly imported from `firebase/auth`.
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, FirebaseError } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEAnhu4mzqnRKu5yRv4mh7PKCmwi5IeWA",
  authDomain: "gps-tracker-cobros.firebaseapp.com",
  projectId: "gps-tracker-cobros",
  storageBucket: "gps-tracker-cobros.firebasestorage.app",
  messagingSenderId: "1072959630335",
  appId: "1:1072959630335:web:b77054dc269e8302acd5ca"
};

// Initialize Firebase if it hasn't been initialized already
let app;
// FIX: Use getApps() to check if app is initialized and initializeApp/getApp for initialization.
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// FIX: Directly uses the imported `getAuth` function.
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
