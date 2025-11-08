
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
import type { User } from 'firebase/auth'; // Direct import of User type

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

// FIX: Removed redundant re-export of Firebase's User type. The direct import should be sufficient.
export type FirebaseUser = User; // Renamed to avoid name collision and make explicit it's the Firebase User.
