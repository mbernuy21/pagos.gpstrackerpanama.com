// All Firebase imports and configuration have been removed or commented out to completely disable Firebase.
// This file now provides in-memory mock implementations for 'auth' and 'db' services.

console.warn("Firebase is currently DISABLED. Using in-memory mock services.");

// --- In-memory data store for mock Firestore ---
interface MockDocData {
  id: string;
  [key: string]: any;
}

const inMemoryClients: MockDocData[] = [];
const inMemoryPayments: MockDocData[] = [];

let nextDocId = 1;

// Mock Timestamp for compatibility
const mockTimestamp = {
  fromDate: (date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 }),
  now: () => ({ toDate: () => new Date(), seconds: Date.now() / 1000, nanoseconds: 0 })
};

// Mock Firestore implementation
const mockFirestore = {
  collection: (path: string) => {
    console.log(`[Mock Firestore] Accessing collection: ${path}`);
    const dataStore = path === 'clients' ? inMemoryClients : inMemoryPayments;

    return {
      where: (field: string, op: string, value: any) => {
        // Simple where clause for userId for compatibility, but data is global
        console.log(`[Mock Firestore] Filtering ${path} by ${field} ${op} ${value}`);
        return {
          get: async () => ({
            docs: dataStore
              .filter(doc => doc[field] === value)
              .map(doc => ({ id: doc.id, data: () => doc }))
          })
        };
      },
      get: async () => ({
        docs: dataStore.map(doc => ({ id: doc.id, data: () => doc }))
      }),
      add: async (data: any) => {
        const id = `mock-id-${nextDocId++}`;
        const newDoc = { id, ...data };
        dataStore.push(newDoc);
        console.log(`[Mock Firestore] Added document to ${path} with ID: ${id}`, newDoc);
        return { id };
      },
      doc: (id?: string) => {
        const docId = id || `mock-id-${nextDocId++}`; // Generate ID if not provided
        return {
          update: async (data: any) => {
            const index = dataStore.findIndex(doc => doc.id === docId);
            if (index !== -1) {
              dataStore[index] = { ...dataStore[index], ...data };
              console.log(`[Mock Firestore] Updated document ${docId} in ${path}.`, dataStore[index]);
            } else {
              console.warn(`[Mock Firestore] Document ${docId} not found in ${path} for update.`);
            }
          },
          delete: async () => {
            const initialLength = dataStore.length;
            dataStore.splice(dataStore.findIndex(doc => doc.id === docId), 1);
            if (dataStore.length < initialLength) {
              console.log(`[Mock Firestore] Deleted document ${docId} from ${path}.`);
            } else {
              console.warn(`[Mock Firestore] Document ${docId} not found in ${path} for deletion.`);
            }
          }
        };
      }
    };
  },
  batch: () => {
    const operations: { ref: any; type: string; data?: any }[] = [];
    return {
      set: (docRef: any, data: any) => {
        operations.push({ ref: docRef, type: 'set', data });
        console.log("[Mock Firestore Batch] Set operation added.", data);
      },
      update: (docRef: any, data: any) => {
        operations.push({ ref: docRef, type: 'update', data });
        console.log("[Mock Firestore Batch] Update operation added.", data);
      },
      delete: (docRef: any) => {
        operations.push({ ref: docRef, type: 'delete' });
        console.log("[Mock Firestore Batch] Delete operation added.");
      },
      commit: async () => {
        console.log("[Mock Firestore Batch] Committing operations...");
        for (const op of operations) {
          if (op.type === 'set') {
            const collectionPath = op.ref._path?.segments[0];
            const dataStore = collectionPath === 'clients' ? inMemoryClients : inMemoryPayments;
            const id = op.ref._documentPath?.id || `mock-id-${nextDocId++}`;
            const newDoc = { id, ...op.data };
            dataStore.push(newDoc);
            op.ref._documentPath = { id }; // Simulate docRef having an ID
            console.log(`[Mock Firestore Batch] Executed set for ${collectionPath} with ID ${id}`, newDoc);
          } else if (op.type === 'update') {
            // Need to mock docRef to have a method to find its collection/id
            const collectionPath = op.ref._path?.segments[0];
            const docId = op.ref._documentPath?.id;
            const dataStore = collectionPath === 'clients' ? inMemoryClients : inMemoryPayments;
            const index = dataStore.findIndex(doc => doc.id === docId);
            if (index !== -1) {
              dataStore[index] = { ...dataStore[index], ...op.data };
              console.log(`[Mock Firestore Batch] Executed update for ${collectionPath} ID ${docId}`, dataStore[index]);
            } else {
              console.warn(`[Mock Firestore Batch] Doc ${docId} not found for update in ${collectionPath}.`);
            }
          } else if (op.type === 'delete') {
            const collectionPath = op.ref._path?.segments[0];
            const docId = op.ref._documentPath?.id;
            const dataStore = collectionPath === 'clients' ? inMemoryClients : inMemoryPayments;
            const initialLength = dataStore.length;
            dataStore.splice(dataStore.findIndex(doc => doc.id === docId), 1);
            if (dataStore.length < initialLength) {
              console.log(`[Mock Firestore Batch] Executed delete for ${collectionPath} ID ${docId}.`);
            } else {
              console.warn(`[Mock Firestore Batch] Doc ${docId} not found for delete in ${collectionPath}.`);
            }
          }
        }
        console.log("[Mock Firestore Batch] Operations committed.");
      }
    };
  },
  // Mock a doc reference for batch operations to work
  _docRef: (collectionPath: string, id: string) => ({
    _path: { segments: [collectionPath] },
    _documentPath: { id },
  }),
  Timestamp: mockTimestamp
};

// Mock Auth implementation
interface MockUser {
  uid: string;
  email: string | null;
}

// A simple in-memory user store
const mockUsers: { [email: string]: MockUser & { password?: string } } = {
  'test@example.com': { uid: 'mock-uid-1', email: 'test@example.com', password: 'password123' }
};

let currentMockUser: MockUser | null = null;
type AuthStateCallback = (user: MockUser | null) => void;
const authStateCallbacks: AuthStateCallback[] = [];

const notifyAuthStateChanged = () => {
  authStateCallbacks.forEach(callback => callback(currentMockUser));
};

const mockAuth = {
  onAuthStateChanged: (callback: AuthStateCallback) => {
    authStateCallbacks.push(callback);
    callback(currentMockUser); // Immediately call with current state
    return () => {
      // Return unsubscribe function
      const index = authStateCallbacks.indexOf(callback);
      if (index > -1) {
        authStateCallbacks.splice(index, 1);
      }
    };
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    console.log(`[Mock Auth] Attempting sign-in for ${email}`);
    const user = mockUsers[email];
    if (user && user.password === password) {
      currentMockUser = { uid: user.uid, email: user.email };
      notifyAuthStateChanged();
      console.log(`[Mock Auth] Signed in: ${email}`);
      return { user: currentMockUser };
    } else {
      console.error(`[Mock Auth] Sign-in failed for ${email}`);
      throw new Error("mock/wrong-password"); // Simulate a common Firebase error code
    }
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    console.log(`[Mock Auth] Attempting to create user ${email}`);
    if (mockUsers[email]) {
      console.error(`[Mock Auth] User ${email} already exists.`);
      throw new Error("mock/email-already-in-use");
    }
    if (password.length < 6) {
      console.error(`[Mock Auth] Weak password for ${email}`);
      throw new Error("mock/weak-password");
    }

    const newUid = `mock-uid-${nextDocId++}`;
    const newUser = { uid: newUid, email, password };
    mockUsers[email] = newUser;
    currentMockUser = { uid: newUid, email };
    notifyAuthStateChanged();
    console.log(`[Mock Auth] User created and signed in: ${email}`);
    return { user: currentMockUser };
  },
  signOut: async () => {
    console.log("[Mock Auth] Signing out.");
    currentMockUser = null;
    notifyAuthStateChanged();
  },
  currentUser: currentMockUser, // Will be updated by signIn/createUser
};


const auth = mockAuth as any;
const db = mockFirestore as any;

export { auth, db };