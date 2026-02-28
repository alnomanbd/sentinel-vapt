import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { NotificationCenter } from './components/NotificationCenter';
import { Dashboard } from './components/Dashboard';
import { FindingsTracker } from './components/FindingsTracker';
import { ApplicationManagement } from './components/ApplicationManagement';
import { RiskRegister } from './components/RiskRegister';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { Sun, Moon } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{activeTab}</h1>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <NotificationCenter />
            <div className="flex items-center space-x-3 border-l border-slate-100 dark:border-slate-800 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scroll-smooth">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'findings' && <FindingsTracker />}
          {activeTab === 'apps' && <ApplicationManagement />}
          {activeTab === 'risk' && <RiskRegister />}
          {activeTab === 'users' && user?.role === 'Admin' && <UserManagement />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
