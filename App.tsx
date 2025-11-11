

import React, { useState, useMemo } from 'react';
import { Layout, Sidebar, Header } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { useFirestoreData } from './hooks/useFirestoreData';
import { DataContext } from './hooks/DataContext';
import { Chatbot } from './components/chatbot/Chatbot';
import { FileText, Grid, Users, Menu, Loader } from 'lucide-react'; // Import Menu and Loader
import { Toaster } from 'react-hot-toast';
import { PaymentManagement } from './components/payments/PaymentManagement';
import { AuthProvider, AuthContext } from './hooks/AuthContext'; 
import { Auth } from './components/auth/Auth'; 
import { useContext } from 'react'; 
import { ClientManagement } from './components/clients/ClientManagement';

export type View = 'dashboard' | 'clients' | 'payments';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useContext(AuthContext)!;

  const [view, setView] = useState<View>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // New state for mobile sidebar
  
  const data = useFirestoreData(user?.uid); 

  const contextValue = useMemo(() => data, [data]);

  const navigationItems = [
    { name: 'Panel', icon: Grid, view: 'dashboard' as View },
    { name: 'Clientes', icon: Users, view: 'clients' as View },
    { name: 'Pagos', icon: FileText, view: 'payments' as View },
  ];
  
  if (authLoading || data.loading) { 
      return (
          <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
              <Loader className="w-12 h-12 animate-spin text-primary-500" />
          </div>
      )
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <DataContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <Layout isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen}> {/* Pass state to Layout */}
          <Sidebar 
            currentView={view} 
            setView={setView} 
            navigationItems={navigationItems} 
            isMobileSidebarOpen={isMobileSidebarOpen} // Pass state to Sidebar
            onClose={() => setIsMobileSidebarOpen(false)} // Pass close function to Sidebar
          />
          <div className="flex flex-col flex-1">
            <Header 
              currentView={view} 
              navigationItems={navigationItems} 
              onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} // Pass toggle function to Header
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {view === 'dashboard' && <Dashboard setView={setView} />}
              {view === 'clients' && <ClientManagement />}
              {view === 'payments' && <PaymentManagement />}
            </main>
          </div>
        </Layout>
        <Chatbot />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </DataContext.Provider>
  );
}


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;