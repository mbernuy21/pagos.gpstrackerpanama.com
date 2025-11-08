

// FIX: Changed Firebase User type import from named export to namespace import to resolve 'no exported member' error,
// aligning with potential environment-specific type definition issues while maintaining Firebase v9 compatibility.
import type * as FirebaseAuthTypes from 'firebase/auth';

export enum PaymentFrequency {
  Monthly = 'Mensual',
  Annual = 'Anual',
}

export enum PaymentStatus {
  Paid = 'Pagado',
  Pending = 'Pendiente',
  Overdue = 'Vencido',
}

export enum ServiceType {
  GPS_SALE = 'GPS - Venta',
  GPS_RENTAL = 'GPS - Alquiler',
  PORTABLE_GPS_SALE = 'GPS Portátil - Venta',
  PORTABLE_GPS_RENTAL = 'GPS Portátil - Alquiler',
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  ruc?: string;
  phone: string;
  email: string;
  serviceType: ServiceType;
  gpsUnits: number;
  paymentAmount: number;
  paymentFrequency: PaymentFrequency;
  nextPaymentDate: string; // ISO string
  registrationDate: string; // ISO string
}

export interface Payment {
  id:string;
  userId: string;
  clientId: string;
  amount: number;
  paymentDate: string; // ISO string
  month: number; // 1-12
  year: number;
}

// FIX: Use the User type from the FirebaseAuthTypes namespace.
export type User = FirebaseAuthTypes.User; // Use Firebase's User type directly