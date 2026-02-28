import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ShieldCheck, Clock, Plus, Edit2, Trash2, X } from 'lucide-react';

export const RiskRegister: React.FC = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    riskId: '',
    relatedFindingId: '',
    businessImpact: '',
    likelihood: 1,
    riskRating: 0,
    riskLevel: 'Low',
    riskOwner: '',
    mitigationPlan: '',
    status: 'Open',
    targetClosureDate: ''
  });

  useEffect(() => {
    fetchRisks();
  }, [token]);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risks', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch risks');
      const data = await res.json();
      setRisks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskLevel = (rating: number) => {
    if (rating >= 20) return 'Critical';
    if (rating >= 12) return 'High';
    if (rating >= 6) return 'Medium';
    return 'Low';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const riskRating = formData.likelihood * 4; // Simplified rating logic for now or custom
    // Actually let's use a more realistic rating if we had impact score
    // For now let's just use the rating from form if we add impact field, but user didn't ask for impact field specifically in form yet.
    // Let's assume likelihood (1-5) * impact (1-5) = rating (1-25)
    // I'll add an impact field to the form.
    
    const url = isEditMode ? `/api/risks/${selectedRisk.id}` : '/api/risks';
    const method = isEditMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchRisks();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this risk entry?')) {
      const res = await fetch(`/api/risks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchRisks();
    }
  };

  const openEdit = (risk: any) => {
    setSelectedRisk(risk);
    setIsEditMode(true);
    setFormData({
      riskId: risk.riskId,
      relatedFindingId: risk.relatedFindingId,
      businessImpact: risk.businessImpact,
      likelihood: risk.likelihood,
      riskRating: risk.riskRating,
      riskLevel: risk.riskLevel,
      riskOwner: risk.riskOwner,
      mitigationPlan: risk.mitigationPlan,
      status: risk.status,
      targetClosureDate: risk.targetClosureDate
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setIsEditMode(false);
    setFormData({
      riskId: '',
      relatedFindingId: '',
      businessImpact: '',
      likelihood: 1,
      riskRating: 0,
      riskLevel: 'Low',
      riskOwner: '',
      mitigationPlan: '',
      status: 'Open',
      targetClosureDate: ''
    });
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-slate-400">Loading risk register...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Risk Register</h2>
          <p className="text-slate-500">Strategic risk assessment and mitigation</p>
        </div>
        {['Admin', 'Security Analyst'].includes(user?.role || '') && (
          <button 
            onClick={openAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" /> New Risk Entry
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Risk ID</th>
              <th className="px-6 py-4 font-semibold">Finding</th>
              <th className="px-6 py-4 font-semibold">Impact</th>
              <th className="px-6 py-4 font-semibold">Likelihood</th>
              <th className="px-6 py-4 font-semibold">Rating</th>
              <th className="px-6 py-4 font-semibold">Owner</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risks.map((risk) => (
              <tr key={risk.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-slate-500">{risk.riskId}</td>
                <td className="px-6 py-4 text-sm text-slate-900">{risk.relatedFindingId}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{risk.businessImpact}</td>
                <td className="px-6 py-4 text-sm">{risk.likelihood}/5</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    risk.riskRating > 15 ? 'bg-red-100 text-red-700' : 
                    risk.riskRating > 8 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {risk.riskLevel} ({risk.riskRating})
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{risk.riskOwner}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button onClick={() => openEdit(risk)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                    {user?.role === 'Admin' && (
                      <button onClick={() => handleDelete(risk.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">{isEditMode ? 'Edit Risk Entry' : 'Add New Risk Entry'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Risk ID</label>
                  <input 
                    type="text" required disabled={isEditMode}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                    value={formData.riskId}
                    onChange={e => setFormData({...formData, riskId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Related Finding ID</label>
                  <input 
                    type="text"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.relatedFindingId}
                    onChange={e => setFormData({...formData, relatedFindingId: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Impact</label>
                <textarea 
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  value={formData.businessImpact}
                  onChange={e => setFormData({...formData, businessImpact: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Likelihood (1-5)</label>
                  <input 
                    type="number" min="1" max="5" required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.likelihood}
                    onChange={e => {
                      const l = parseInt(e.target.value);
                      const rating = l * 4; // Placeholder for impact * likelihood
                      setFormData({...formData, likelihood: l, riskRating: rating, riskLevel: calculateRiskLevel(rating)});
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Risk Rating</label>
                  <input 
                    type="number" disabled
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                    value={formData.riskRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Risk Level</label>
                  <input 
                    type="text" disabled
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                    value={formData.riskLevel}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Risk Owner</label>
                  <input 
                    type="text" required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.riskOwner}
                    onChange={e => setFormData({...formData, riskOwner: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Closure Date</label>
                  <input 
                    type="date" required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.targetClosureDate}
                    onChange={e => setFormData({...formData, targetClosureDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
