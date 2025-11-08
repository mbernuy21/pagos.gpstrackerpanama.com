
import { createContext } from 'react';
import { Client, Payment } from '../types';

export interface IDataContext {
  clients: Client[];
  payments: Payment[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id' | 'registrationDate' | 'userId'>) => Promise<void>;
  addMultipleClients: (clients: Omit<Client, 'id' | 'registrationDate' | 'userId'>[]) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'userId'>) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
}

export const DataContext = createContext<IDataContext | null>(null);