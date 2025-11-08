import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';
import { User } from '../types'; // Import the Firebase User type re-exported from types.ts

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
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: User | null) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      await auth.signInWithEmailAndPassword(email, password);
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
      await auth.createUserWithEmailAndPassword(email, password);
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
      await auth.signOut();
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
