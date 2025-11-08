import { useState, useEffect, useCallback } from 'react';
import { Client, Payment } from '../types';
import { IDataContext } from './DataContext';
import { db } from '../firebase/config';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    writeBatch,
    Timestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data;
}

export function useFirestoreData(userId?: string): IDataContext {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) {
        setLoading(false);
        return;
    };
    setLoading(true);
    try {
        const clientQuery = query(collection(db, 'clients'), where('userId', '==', userId));
        const clientSnapshot = await getDocs(clientQuery);
        const clientsData = clientSnapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) })) as Client[];
        setClients(clientsData);

        const paymentQuery = query(collection(db, 'payments'), where('userId', '==', userId));
        const paymentSnapshot = await getDocs(paymentQuery);
        const paymentsData = paymentSnapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) })) as Payment[];
        setPayments(paymentsData);

    } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
        toast.error("Error al cargar los datos.");
    } finally {
        setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addClient = async (clientData: Omit<Client, 'id' | 'registrationDate' | 'userId'>) => {
    if (!userId) throw new Error("Usuario no autenticado.");
    const newClient = {
        ...clientData,
        userId,
        registrationDate: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'clients'), newClient);
    setClients(prev => [...prev, { ...newClient, id: docRef.id }]);
  };

  const addMultipleClients = async (newClients: Omit<Client, 'id' | 'registrationDate' | 'userId'>[]) => {
    if (!userId) throw new Error("Usuario no autenticado.");
    const batch = writeBatch(db);
    const clientsToAdd: Client[] = [];

    newClients.forEach(client => {
        const clientData = {
            ...client,
            userId,
            registrationDate: new Date().toISOString()
        };
        const docRef = doc(collection(db, 'clients'));
        batch.set(docRef, clientData);
        clientsToAdd.push({ ...clientData, id: docRef.id });
    });
    
    await batch.commit();
    setClients(prev => [...prev, ...clientsToAdd]);
  };

  const updateClient = async (updatedClient: Client) => {
    const clientRef = doc(db, 'clients', updatedClient.id);
    await updateDoc(clientRef, updatedClient);
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };
  
  const deleteClient = async (clientId: string) => {
    await deleteDoc(doc(db, 'clients', clientId));
    // Also delete associated payments
    const batch = writeBatch(db);
    const paymentsToDelete = payments.filter(p => p.clientId === clientId);
    paymentsToDelete.forEach(p => {
        batch.delete(doc(db, 'payments', p.id));
    });
    await batch.commit();

    setClients(prev => prev.filter(c => c.id !== clientId));
    setPayments(prev => prev.filter(p => p.clientId !== clientId));
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'userId'>) => {
    if (!userId) throw new Error("Usuario no autenticado.");
    const newPayment = {
        ...paymentData,
        userId
    };
    const docRef = await addDoc(collection(db, 'payments'), newPayment);
    setPayments(prev => [...prev, { ...newPayment, id: docRef.id }]);
  };

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  return { clients, payments, loading, addClient, updateClient, deleteClient, addPayment, getClientById, addMultipleClients };
}