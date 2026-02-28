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
          <h2 className="text-2xl font-bold text-slate-900">Application Management</h2>
          <p className="text-slate-500">Manage assets and environments</p>
        </div>
        {['Admin', 'Security Analyst'].includes(user?.role || '') && (
          <button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} className="mr-2" /> Add Application
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Database size={24} />
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setSelectedApp(app); setIsEditMode(true); setFormData(app); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(app.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{app.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{app.appId} • {app.environment}</p>
            <div className="flex items-center text-sm text-slate-600">
              <Shield size={16} className="mr-2" />
              <span>Owner: {app.owner}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{isEditMode ? 'Edit App' : 'New App'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="App ID (e.g. APP-001)" required className="w-full p-2 border border-slate-200 rounded-lg" value={formData.appId} onChange={e => setFormData({...formData, appId: e.target.value})} />
              <input type="text" placeholder="App Name" required className="w-full p-2 border border-slate-200 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Owner" required className="w-full p-2 border border-slate-200 rounded-lg" value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
              <select className="w-full p-2 border border-slate-200 rounded-lg" value={formData.environment} onChange={e => setFormData({...formData, environment: e.target.value as any})}>
                <option value="Prod">Prod</option>
                <option value="UAT">UAT</option>
                <option value="Dev">Dev</option>
              </select>
              <textarea placeholder="Description" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
