import { useState, useEffect, useCallback } from 'react';
import { Client, Payment } from '../types';
import { IDataContext } from './DataContext';
import { db } from '../firebase/config'; // Import the mock db
import toast from 'react-hot-toast';

export function useFirestoreData(userId?: string): IDataContext {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to load initial data from mock DB
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate fetching data with the mock db
      const clientSnapshot = await db.collection('clients').where('userId', '==', userId).get();
      const clientsData = clientSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Client[];
      setClients(clientsData);

      const paymentSnapshot = await db.collection('payments').where('userId', '==', userId).get();
      const paymentsData = paymentSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Payment[];
      setPayments(paymentsData);

    } catch (error) {
      console.error("Error fetching data from mock Firestore: ", error);
      toast.error("Error al cargar los datos mock.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Effect to fetch data when userId changes or on component mount
  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      setClients([]);
      setPayments([]);
      setLoading(false);
    }
  }, [userId, fetchData]);

  const addClient = async (clientData: Omit<Client, 'id' | 'registrationDate' | 'userId'>) => {
    if (!userId) {
      toast.error("Usuario no autenticado para añadir cliente.");
      return;
    }
    const newClient = {
        ...clientData,
        userId,
        registrationDate: new Date().toISOString()
    };
    const docRef = await db.collection('clients').add(newClient);
    setClients(prev => [...prev, { ...newClient, id: docRef.id }]);
  };

  const addMultipleClients = async (newClients: Omit<Client, 'id' | 'registrationDate' | 'userId'>[]) => {
    if (!userId) {
      toast.error("Usuario no autenticado para añadir múltiples clientes.");
      return;
    }
    const batch = db.batch();
    const clientsToAdd: Client[] = [];

    newClients.forEach(client => {
        const clientData = {
            ...client,
            userId,
            registrationDate: new Date().toISOString()
        };
        const docRef = db.collection('clients').doc(); // Mock doc ref
        batch.set(db._docRef('clients', docRef.id), clientData); // Use mock docRef
        clientsToAdd.push({ ...clientData, id: docRef.id });
    });
    
    await batch.commit();
    setClients(prev => [...prev, ...clientsToAdd]);
  };

  const updateClient = async (updatedClient: Client) => {
    await db.collection('clients').doc(updatedClient.id).update(updatedClient);
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };
  
  const deleteClient = async (clientId: string) => {
    await db.collection('clients').doc(clientId).delete();
    
    const batch = db.batch();
    const paymentsToDelete = payments.filter(p => p.clientId === clientId);
    paymentsToDelete.forEach(p => {
        batch.delete(db._docRef('payments', p.id)); // Use mock docRef
    });
    await batch.commit();

    setClients(prev => prev.filter(c => c.id !== clientId));
    setPayments(prev => prev.filter(p => p.clientId !== clientId));
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'userId'>) => {
    if (!userId) {
      toast.error("Usuario no autenticado para añadir pago.");
      return;
    }
    const newPayment = {
        ...paymentData,
        userId
    };
    const docRef = await db.collection('payments').add(newPayment);
    setPayments(prev => [...prev, { ...newPayment, id: docRef.id }]);
  };

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  return { clients, payments, loading, addClient, updateClient, deleteClient, addPayment, getClientById, addMultipleClients };
}