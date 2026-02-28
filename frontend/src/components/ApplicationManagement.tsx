import React, { useEffect, useState } from 'react';
import { Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Database, Shield } from 'lucide-react';

export const ApplicationManagement: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    appId: '',
    name: '',
    owner: '',
    environment: 'Prod',
    description: ''
  });

  useEffect(() => {
    fetchApps();
  }, [token]);

  const fetchApps = async () => {
    const res = await fetch('/api/apps', { headers: { 'Authorization': `Bearer ${token}` } });
    setApps(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditMode ? `/api/apps/${selectedApp?.id}` : '/api/apps';
    const method = isEditMode ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchApps();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this application?')) {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchApps();
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Application Management</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage assets and environments</p>
        </div>
        {['Admin', 'Security Analyst'].includes(user?.role || '') && (
          <button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
            <Plus size={18} className="mr-2" /> Add Application
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <div key={app.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelectedApp(app); setIsEditMode(true); setFormData(app); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(app.id)} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{app.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{app.appId} • {app.environment}</p>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <Shield size={16} className="mr-2 text-emerald-500" />
              <span>Owner: {app.owner}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">{isEditMode ? 'Edit App' : 'New App'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">App ID</label>
                <input type="text" placeholder="e.g. APP-001" required className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.appId} onChange={e => setFormData({...formData, appId: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">App Name</label>
                <input type="text" placeholder="App Name" required className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Owner</label>
                <input type="text" placeholder="Owner" required className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Environment</label>
                <select className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.environment} onChange={e => setFormData({...formData, environment: e.target.value as any})}>
                  <option value="Prod">Prod</option>
                  <option value="UAT">UAT</option>
                  <option value="Dev">Dev</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea placeholder="Description" className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
