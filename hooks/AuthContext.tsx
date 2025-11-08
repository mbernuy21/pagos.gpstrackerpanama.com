
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '../firebase/config'; 
import toast from 'react-hot-toast';
// FIX: Updated to use `FirebaseUser` type from `types.ts` to prevent name collision with local `User` context and align with revised `types.ts`.
import { FirebaseUser } from '../types'; 
// Importar funciones de autenticación del SDK modular
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  // FIX: FirebaseError is correctly imported from firebase/auth for the modular SDK.
  FirebaseError 
} from 'firebase/auth';

interface AuthContextType {
  // FIX: Updated to use `FirebaseUser` type.
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // --- CAMBIOS PARA RESTAURAR AUTENTICACIÓN ---
  // FIX: Updated to use `FirebaseUser` type.
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true); // Inicia en true mientras se verifica el estado de autenticación

  // Escucha cambios en el estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // FIX: Cast firebaseUser to FirebaseUser type for consistency.
      setUser(firebaseUser as FirebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Funciones de login, register y logout con llamadas reales a Firebase
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('¡Inicio de sesión exitoso!');
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Propagar el error para que el componente Auth lo maneje
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('¡Cuenta creada exitosamente!');
    } catch (error) {
      console.error("Register error:", error);
      throw error; // Propagar el error para que el componente Auth lo maneje
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success('¡Sesión cerrada!');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error('Error al cerrar sesión.');
    }
  }, []);
  // --- FIN CAMBIOS ---

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};