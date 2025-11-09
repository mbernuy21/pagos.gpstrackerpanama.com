
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEAnhu4mzqnRKu5yRv4mh7PKCmwi5IeWA", // Clave API genérica, ya que Firebase no proporciona una única en tu consola.
  authDomain: "gps-tracker-cobros.firebaseapp.com",
  projectId: "gps-tracker-cobros",
  storageBucket: "gps-tracker-cobros.firebasestorage.app",
  messagingSenderId: "1072959630335",
  appId: "1:1072959630335:web:22e16933a8557598acd5ca" // Este appId coincide con tu última captura.
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };