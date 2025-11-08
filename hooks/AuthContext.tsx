
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
        await auth.signOut();
        toast.success('Sesión cerrada exitosamente.');
    } catch (error) {
        console.error("Error signing out: ", error);
        toast.error('Error al cerrar sesión.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};