
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
} from 'firebase/auth';
// FIX: FirebaseError is correctly imported from firebase/app for the modular SDK.
import { FirebaseError } from 'firebase/app';

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
  // --- CAMBIOS PARA DESHABILITAR AUTENTICACIÓN TEMPORALMENTE ---
  // Establece user como null y loading como false para que la app cargue la UI.
  // Las funciones de login/register/logout no harán nada o mostrarán un mensaje.
  const user: FirebaseUser | null = null; // Siempre null para deshabilitar auth
  const loading = false; // Siempre false para no mostrar el loader de auth

  // Funciones de login, register y logout ahora solo mostrarán un mensaje de error/advertencia.
  const login = useCallback(async (email: string, password: string) => {
    toast.error("Autenticación deshabilitada temporalmente.");
    console.warn("Autenticación deshabilitada. No se puede iniciar sesión.");
    throw new Error("Autenticación deshabilitada."); // Para simular un fallo si se llama
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    toast.error("Autenticación deshabilitada temporalmente.");
    console.warn("Autenticación deshabilitada. No se puede registrar.");
    throw new Error("Autenticación deshabilitada."); // Para simular un fallo si se llama
  }, []);

  const logout = useCallback(async () => {
    toast.error("Autenticación deshabilitada temporalmente.");
    console.warn("Autenticación deshabilitada. No se puede cerrar sesión.");
  }, []);

  // Elimina el useEffect que escucha onAuthStateChanged, ya no es necesario.
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
  //     setUser(firebaseUser as FirebaseUser);
  //     setLoading(false);
  //   });
  //   return () => unsubscribe();
  // }, []);
  // --- FIN CAMBIOS PARA DESHABILITAR AUTENTICACIÓN ---

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};