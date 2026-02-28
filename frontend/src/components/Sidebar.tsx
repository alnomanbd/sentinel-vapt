import { 
  LayoutDashboard, 
  ShieldAlert, 
  Database, 
  ClipboardList, 
  LogOut,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'findings', label: 'Findings Tracker', icon: ShieldAlert },
    { id: 'apps', label: 'Applications', icon: Database },
    { id: 'risk', label: 'Risk Register', icon: ClipboardList },
    ...(user?.role === 'Admin' ? [{ id: 'users', label: 'User Management', icon: UserIcon }] : []),
  ];

  return (
    <div className={cn(
      "h-screen bg-[#0f172a] text-slate-300 transition-all duration-300 flex flex-col border-r border-slate-800",
      isOpen ? "w-64" : "w-20"
    )}>
      <div className="p-6 flex items-center justify-between">
        {isOpen && <h1 className="text-xl font-bold text-white tracking-tight">Sentinel<span className="text-blue-500">VAPT</span></h1>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-slate-800 rounded">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center p-3 rounded-lg transition-colors",
              activeTab === item.id ? "bg-blue-600 text-white" : "hover:bg-slate-800"
            )}
          >
            <item.icon size={20} />
            {isOpen && <span className="ml-4 font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center p-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
            <UserIcon size={20} />
          </div>
          {isOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
          )}
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center p-3 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          {isOpen && <span className="ml-4 font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};
