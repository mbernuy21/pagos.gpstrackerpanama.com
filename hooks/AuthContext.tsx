
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';
import { User } from '../types'; // Import the Firebase User type re-exported from types.ts
// FIX: Changed Firebase authentication functions imports from named exports to a namespace import to resolve 'no exported member' errors,
// aligning with potential environment-specific type definition issues while maintaining Firebase v9 compatibility.
import * as FirebaseAuth from 'firebase/auth'; // Import modular auth functions

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to listen to Firebase auth state changes
  useEffect(() => {
    // FIX: Use onAuthStateChanged from FirebaseAuth namespace.
    const unsubscribe = FirebaseAuth.onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      // FIX: Use signInWithEmailAndPassword from FirebaseAuth namespace.
      await FirebaseAuth.signInWithEmailAndPassword(auth, email, password);
      toast.success('¡Bienvenido de nuevo!');
    } catch (error: any) {
      console.error("Error signing in: ", error);
      throw error; // Re-throw to be caught by Auth component for specific error messages
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      // FIX: Use createUserWithEmailAndPassword from FirebaseAuth namespace.
      await FirebaseAuth.createUserWithEmailAndPassword(auth, email, password);
      toast.success('¡Cuenta creada exitosamente!');
    } catch (error: any) {
      console.error("Error creating user: ", error);
      throw error; // Re-throw to be caught by Auth component
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      // FIX: Use signOut from FirebaseAuth namespace.
      await FirebaseAuth.signOut(auth);
      toast.success('Sesión cerrada exitosamente.');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error('Error al cerrar sesión.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};