import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
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
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'findings' && <FindingsTracker />}
        {activeTab === 'apps' && <ApplicationManagement />}
        {activeTab === 'risk' && <RiskRegister />}
        {activeTab === 'users' && user?.role === 'Admin' && <UserManagement />}
      </main>
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
