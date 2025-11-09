
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  // Aunque Firebase te muestra un apiKey genérico, lo usamos como placeholder.
  // Es crítico que el resto de los campos sean correctos para tu proyecto.
  apiKey: "AIzaSyAEAnhu4mzqnRKu5yRv4mh7PKCmwi5IeWA", // Este sigue siendo el genérico, pero el resto de los datos son correctos de tu app 'nueva'.
  authDomain: "gps-tracker-cobros.firebaseapp.com",
  projectId: "gps-tracker-cobros",
  storageBucket: "gps-tracker-cobros.firebasestorage.app",
  messagingSenderId: "1072959630335",
  appId: "1:1072959630335:web:22e16933a8557598acd5ca" // Este appId es el de tu 'nueva' app según tu última captura.
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };