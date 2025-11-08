
import { useState, useEffect, useCallback } from 'react';
import { Client, Payment } from '../types';
import { IDataContext } from './DataContext';
import { db } from '../firebase/config'; // Import the real db
// FIX: Imported Timestamp directly from 'firebase/firestore' for modular SDK compatibility.
import { Timestamp } from 'firebase/firestore'; 
import toast from 'react-hot-toast';

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestampsToISO = (data: any) => {
  const newData = { ...data };
  if (newData.registrationDate && newData.registrationDate.toDate) {
    newData.registrationDate = newData.registrationDate.toDate().toISOString();
  }
  if (newData.nextPaymentDate && newData.nextPaymentDate.toDate) {
    newData.nextPaymentDate = newData.nextPaymentDate.toDate().toISOString();
  }
  if (newData.paymentDate && newData.paymentDate.toDate) {
    newData.paymentDate = newData.paymentDate.toDate().toISOString();
  }
  return newData;
};


export function useFirestoreData(userId?: string): IDataContext {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (userId) {
        // Fetch clients
        const clientSnapshot = await db.collection('clients').where('userId', '==', userId).get();
        const clientsData = clientSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...convertTimestampsToISO(doc.data()) 
        })) as Client[];
        setClients(clientsData);

        // Fetch payments
        const paymentSnapshot = await db.collection('payments').where('userId', '==', userId).get();
        const paymentsData = paymentSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...convertTimestampsToISO(doc.data()) 
        })) as Payment[];
        setPayments(paymentsData);
      } else {
        setClients([]);
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching data from Firestore: ", error);
      toast.error("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // Setup real-time listeners for clients and payments
      const unsubscribeClients = db.collection('clients')
        .where('userId', '==', userId)
        .onSnapshot(snapshot => {
          const clientsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestampsToISO(doc.data())
          })) as Client[];
          setClients(clientsData);
          setLoading(false); // Only set loading to false after first data fetch
        }, (error) => {
          console.error("Error listening to clients: ", error);
          toast.error("Error al escuchar cambios en clientes.");
          setLoading(false);
        });

      const unsubscribePayments = db.collection('payments')
        .where('userId', '==', userId)
        .onSnapshot(snapshot => {
          const paymentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestampsToISO(doc.data())
          })) as Payment[];
          setPayments(paymentsData);
          setLoading(false); // Only set loading to false after first data fetch
        }, (error) => {
          console.error("Error listening to payments: ", error);
          toast.error("Error al escuchar cambios en pagos.");
          setLoading(false);
        });

      // Cleanup listeners on unmount or userId change
      return () => {
        unsubscribeClients();
        unsubscribePayments();
      };
    } else {
      setClients([]);
      setPayments([]);
      setLoading(false);
    }
  }, [userId]);


  const addClient = async (clientData: Omit<Client, 'id' | 'registrationDate' | 'userId'>) => {
    if (!userId) {
      toast.error("Usuario no autenticado para añadir cliente.");
      return;
    }
    try {
      const newClient = {
          ...clientData,
          userId,
          // FIX: Use Timestamp from direct import
          registrationDate: Timestamp.fromDate(new Date()) // Store as Firestore Timestamp
      };
      const docRef = await db.collection('clients').add(newClient);
      toast.success('¡Cliente añadido exitosamente!');
    } catch (error) {
      console.error("Error adding client: ", error);
      toast.error("Error al añadir cliente.");
    }
  };

  const addMultipleClients = async (newClients: Omit<Client, 'id' | 'registrationDate' | 'userId'>[]) => {
    if (!userId) {
      toast.error("Usuario no autenticado para añadir múltiples clientes.");
      return;
    }
    try {
      const batch = db.batch();
      newClients.forEach(client => {
          const clientData = {
              ...client,
              userId,
              // FIX: Use Timestamp from direct import
              registrationDate: Timestamp.fromDate(new Date()), // Store as Firestore Timestamp
              nextPaymentDate: Timestamp.fromDate(new Date(client.nextPaymentDate)), // Ensure nextPaymentDate is also Timestamp
          };
          const docRef = db.collection('clients').doc();
          batch.set(docRef, clientData);
      });
      
      await batch.commit();
      toast.success(`${newClients.length} clientes importados exitosamente!`);
    } catch (error) {
      console.error("Error adding multiple clients: ", error);
      toast.error("Error al importar clientes.");
    }
  };

  const updateClient = async (updatedClient: Client) => {
    if (!userId) {
      toast.error("Usuario no autenticado para actualizar cliente.");
      return;
    }
    try {
      // Convert ISO strings back to Firestore Timestamps for storage
      const clientDataForFirestore = {
        ...updatedClient,
        // FIX: Use Timestamp from direct import
        registrationDate: Timestamp.fromDate(new Date(updatedClient.registrationDate)),
        nextPaymentDate: Timestamp.fromDate(new Date(updatedClient.nextPaymentDate)),
      }
      await db.collection('clients').doc(updatedClient.id).update(clientDataForFirestore);
      toast.success('¡Cliente actualizado exitosamente!');
    } catch (error) {
      console.error("Error updating client: ", error);
      toast.error("Error al actualizar cliente.");
    }
  };
  
  const deleteClient = async (clientId: string) => {
    if (!userId) {
      toast.error("Usuario no autenticado para eliminar cliente.");
      return;
    }
    try {
      const batch = db.batch();
      // Delete client document
      batch.delete(db.collection('clients').doc(clientId));
      
      // Delete all associated payments
      const paymentsSnapshot = await db.collection('payments').where('clientId', '==', clientId).get();
      paymentsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
      });
      await batch.commit();
      toast.success('¡Cliente y pagos asociados eliminados exitosamente!');
    } catch (error) {
      console.error("Error deleting client: ", error);
      toast.error("Error al eliminar cliente.");
    }
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'userId'>) => {
    if (!userId) {
      toast.error("Usuario no autenticado para añadir pago.");
      return;
    }
    try {
      const newPayment = {
          ...paymentData,
          userId,
          // FIX: Use Timestamp from direct import
          paymentDate: Timestamp.fromDate(new Date(paymentData.paymentDate)) // Store as Firestore Timestamp
      };
      await db.collection('payments').add(newPayment);
      toast.success('¡Pago registrado exitosamente!');
    } catch (error) {
      console.error("Error adding payment: ", error);
      toast.error("Error al añadir pago.");
    }
  };

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  return { clients, payments, loading, addClient, updateClient, deleteClient, addPayment, getClientById, addMultipleClients };
}