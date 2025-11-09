
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
  // --- CAMBIOS PARA RESTAURAR AUTENTICACIÓN ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("¡Inicio de sesión exitoso!");
    } catch (error: any) {
        // Manejo de errores específicos de Firebase
        if (error instanceof FirebaseError) {
          throw error; // Re-lanza para que el componente Auth lo maneje
        }
        console.error("Login failed:", error);
        toast.error("Error al iniciar sesión.");
        throw new Error("Error desconocido al iniciar sesión.");
    } finally {
      setLoading(false); // Se ajusta para que la autenticación establezca el loading a false al finalizar.
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("¡Cuenta creada exitosamente!");
    } catch (error: any) {
        if (error instanceof FirebaseError) {
          throw error; // Re-lanza para que el componente Auth lo maneje
        }
        console.error("Registration failed:", error);
        toast.error("Error al registrarse.");
        throw new Error("Error desconocido al registrarse.");
    } finally {
      setLoading(false); // Se ajusta para que la autenticación establezca el loading a false al finalizar.
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.success("¡Sesión cerrada exitosamente!");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Error al cerrar sesión.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser as FirebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  // --- FIN CAMBIOS PARA RESTAURAR AUTENTICACIÓN ---

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};