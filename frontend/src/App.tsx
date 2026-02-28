import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { NotificationCenter } from './components/NotificationCenter';
import { Dashboard } from './components/Dashboard';
import { FindingsTracker } from './components/FindingsTracker';
import { ApplicationManagement } from './components/ApplicationManagement';
import { RiskRegister } from './components/RiskRegister';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{activeTab}</h1>
          </div>
          <div className="flex items-center space-x-6">
            <NotificationCenter />
            <div className="flex items-center space-x-3 border-l border-slate-100 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
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
      <MainApp />
    </AuthProvider>
  );
}
