

import React, { ReactNode, useContext } from 'react'; 
import { Bell, Sun, Moon, MapPin, LogOut, Menu } from 'lucide-react'; // Added LogOut and Menu
import type { View } from '../../App';
import type { LucideProps } from 'lucide-react';
import { AuthContext } from '../../hooks/AuthContext'; 
import { Button } from '../ui'; 

interface LayoutProps {
  children: ReactNode;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
  return (
    <div className="flex h-screen">
      {/* Overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      {children}
    </div>
  );
};


interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  navigationItems: { name: string; icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>; view: View }[];
  isMobileSidebarOpen: boolean; // New prop
  onClose: () => void; // New prop
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, navigationItems, isMobileSidebarOpen, onClose }) => {
  return (
    <aside 
      className={`w-64 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700/50 flex-col 
                 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 
                 lg:relative lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:flex`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
        <MapPin className="text-primary-500" />
        <h1 className="ml-2 text-xl font-bold">GPS Tracker</h1>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          {navigationItems.map(item => (
            <li key={item.name}>
              <button 
                onClick={() => {
                  setView(item.view);
                  onClose(); // Close sidebar on navigation
                }}
                className={`w-full flex items-center px-4 py-2 my-1 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.view 
                  ? 'bg-primary-500 text-white' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};


interface HeaderProps {
    currentView: View;
    navigationItems: { name: string; view: View }[];
    onMenuToggle: () => void; // New prop
}

export const Header: React.FC<HeaderProps> = ({ currentView, navigationItems, onMenuToggle }) => {
  const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'));
  const { user, logout } = useContext(AuthContext)!; 
  
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const currentViewName = navigationItems.find(item => item.view === currentView)?.name || currentView;
  
  return (
    <header className="h-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center"> {/* Group menu toggle and title */}
        <button
          onClick={onMenuToggle}
          className="p-2 mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-semibold capitalize">{currentViewName}</h2>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm hidden sm:inline">{user?.email || 'Invitado'}</span> 
        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
          <Bell size={20} />
        </button>
        {user && ( 
            <Button variant="ghost" onClick={logout} className="!p-2 h-auto text-slate-600 dark:text-slate-300">
              <LogOut size={20} />
            </Button>
        )}
      </div>
    </header>
  );
};