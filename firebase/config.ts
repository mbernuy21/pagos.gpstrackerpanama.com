
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// IMPORTANT: Hardcoding configuration is not recommended for production environments.
// It's more secure to use environment variables to protect sensitive data.
// This configuration is used to resolve an immediate connection issue in this environment.
const firebaseConfig = {
  apiKey: "AIzaSyAEAnhu4mzqnRKu5yRv4mh7PKCmwi5IeWA",
  authDomain: "gps-tracker-cobros.firebaseapp.com",
  projectId: "gps-tracker-cobros",
  storageBucket: "gps-tracker-cobros.firebasestorage.app",
  messagingSenderId: "1072959630335",
  appId: "1:1072959630335:web:d498eea7f4135835acd5ca"
};


// Initialize Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}


// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };