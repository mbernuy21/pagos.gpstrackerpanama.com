

import React, { useState, useContext } from 'react';
import { Card, CardHeader, CardContent, Input, Button } from '../ui';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../hooks/AuthContext'; // Import AuthContext
// FIX: Updated Firebase AuthError type import to use the modular Firebase SDK.
// In Firebase v9, authentication errors are typically instances of FirebaseError, exported from 'firebase/app'.
import type { FirebaseError } from 'firebase/app'; 

const getErrorMessage = (error: FirebaseError): string => {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'El formato del correo electrónico no es válido.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Correo electrónico o contraseña incorrectos.';
        case 'auth/email-already-in-use':
            return 'Este correo electrónico ya está registrado.';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        case 'auth/network-request-failed':
            return 'Error de red. Por favor, compruebe su conexión a Internet.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo más tarde.';
        default:
            console.error("Firebase Auth Error:", error.code, error.message);
            return 'Ocurrió un error. Por favor, intente de nuevo.';
    }
}

export const Auth: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("Auth must be used within an AuthProvider");
  }
  const { login, register } = authContext;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (error: any) {
        // Firebase AuthError objects have a 'code' property
        toast.error(getErrorMessage(error as FirebaseError));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
                <MapPin className="text-primary-500 h-8 w-8" />
                <h1 className="ml-2 text-2xl font-bold">GPS Tracker Panama</h1>
            </div>
          <h2 className="text-xl font-semibold">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
          <p className="text-sm text-slate-500">
            {isLogin ? 'Ingresa a tu panel de gestión de cobros' : 'Crea una cuenta para empezar a gestionar tus clientes'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
                label="Correo Electrónico"
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
            />
            <Input 
                label="Contraseña"
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (isLogin ? 'Ingresando...' : 'Creando cuenta...') : (isLogin ? 'Ingresar' : 'Crear Cuenta')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              {isLogin ? '¿No tienes una cuenta? Crear una' : '¿Ya tienes una cuenta? Iniciar Sesión'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};