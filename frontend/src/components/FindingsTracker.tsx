import React, { useEffect, useState } from 'react';
import { Finding, Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { getSeverityColor, getStatusColor, calculateSeverity } from '../utils/helpers';
import { Plus, Filter, Download, Search, Edit2, Trash2, Upload, FileText, FileSpreadsheet, Eye, AlertTriangle } from 'lucide-react';
import { FindingDetailModal } from './FindingDetailModal';
import { OWASP_TOP_10, MITRE_ATTACK_TACTICS } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const FindingsTracker: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    findingId: '',
    appId: '',
    title: '',
    description: '',
    impact: '',
    cvssScore: 0,
    owaspCategory: '',
    mitreAttack: '',
    status: 'Open',
    dueDate: '',
    remediationSteps: ''
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    const [fRes, aRes] = await Promise.all([
      fetch('/api/findings', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/apps', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    setFindings(await fRes.json());
    setApps(await aRes.json());
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('SentinelVAPT - Findings Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = filteredFindings.map(f => [
      f.findingId,
      f.appName,
      f.title,
      f.severity,
      f.status,
      f.reportedDate || 'N/A'
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Application', 'Title', 'Severity', 'Status', 'Reported Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] }
    });

    doc.save(`findings_report_${Date.now()}.pdf`);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredFindings.map(f => ({
      'Finding ID': f.findingId,
      'Application': f.appName,
      'Title': f.title,
      'Description': f.description,
      'Severity': f.severity,
      'CVSS Score': f.cvssScore,
      'Status': f.status,
      'OWASP Category': f.owaspCategory,
      'Reported Date': f.reportedDate,
      'Due Date': f.dueDate,
      'Remediation': f.remediationSteps
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Findings');
    XLSX.writeFile(workbook, `findings_export_${Date.now()}.xlsx`);
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !['Closed', 'Accepted Risk'].includes(formData.status);
  };

  const filteredFindings = findings.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         f.findingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.appName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const severity = calculateSeverity(formData.cvssScore);
    const url = isEditMode ? `/api/findings/${selectedFinding?.id}` : '/api/findings';
    const method = isEditMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...formData, severity })
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this finding?')) {
      const res = await fetch(`/api/findings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    }
  };

  const openAdd = () => {
    setIsEditMode(false);
    setFormData({
      findingId: '',
      appId: '',
      title: '',
      description: '',
      impact: '',
      cvssScore: 0,
      owaspCategory: '',
      mitreAttack: '',
      status: 'Open',
      dueDate: '',
      remediationSteps: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (finding: Finding) => {
    setSelectedFinding(finding);
    setIsEditMode(true);
    setFormData({
      findingId: finding.findingId,
      appId: finding.appId,
      title: finding.title,
      description: finding.description,
      impact: finding.impact,
      cvssScore: finding.cvssScore,
      owaspCategory: finding.owaspCategory,
      mitreAttack: finding.mitreAttack || '',
      status: finding.status,
      dueDate: finding.dueDate,
      remediationSteps: finding.remediationSteps
    });
    setIsModalOpen(true);
  };

  const openDetail = (finding: Finding) => {
    setSelectedFinding(finding);
    setIsDetailModalOpen(true);
  };

  const handleFileUpload = async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('evidence', file);
    const res = await fetch(`/api/findings/${id}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) fetchData();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Findings Tracker</h2>
          <p className="text-slate-500">Manage and track security vulnerabilities</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={exportPDF}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={18} className="mr-2" /> Export PDF
          </button>
          <button 
            onClick={exportExcel}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet size={18} className="mr-2" /> Export Excel
          </button>
          {['Admin', 'Security Analyst'].includes(user?.role || '') && (
            <button 
              onClick={openAdd}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-2" /> New Finding
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search findings..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Application</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFindings.map((finding) => (
                <tr key={finding.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{finding.findingId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{finding.appName}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{finding.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getSeverityColor(finding.severity)}`}>
                      {finding.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(finding.status)}`}>
                        {finding.status}
                      </span>
                      {finding.dueDate && new Date(finding.dueDate) < new Date() && finding.status !== 'Closed' && (
                        <span className="flex items-center text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                          <AlertTriangle size={10} className="mr-1" /> Overdue
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => openDetail(finding)} className="p-1 text-slate-400 hover:text-blue-600" title="View Details"><Eye size={16} /></button>
                      <button onClick={() => openEdit(finding)} className="p-1 text-slate-400 hover:text-blue-600" title="Edit"><Edit2 size={16} /></button>
                      {user?.role === 'Admin' && (
                        <button onClick={() => handleDelete(finding.id)} className="p-1 text-slate-400 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">{isEditMode ? 'Edit Finding' : 'Add New Finding'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Finding ID</label>
                  <input 
                    type="text" required disabled={isEditMode}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                    value={formData.findingId}
                    onChange={e => setFormData({...formData, findingId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Application</label>
                  <select 
                    required disabled={isEditMode}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                    value={formData.appId}
                    onChange={e => setFormData({...formData, appId: e.target.value})}
                  >
                    <option value="">Select App</option>
                    {apps.map(app => <option key={app.id} value={app.appId}>{app.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" required
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CVSS Score (0-10)</label>
                  <input 
                    type="number" step="0.1" min="0" max="10" required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.cvssScore}
                    onChange={e => setFormData({...formData, cvssScore: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                    <option value="Accepted Risk">Accepted Risk</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">OWASP Category</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.owaspCategory}
                    onChange={e => setFormData({...formData, owaspCategory: e.target.value})}
                  >
                    <option value="">Select OWASP Category</option>
                    {OWASP_TOP_10.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">MITRE ATT&CK Tactic</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.mitreAttack}
                    onChange={e => setFormData({...formData, mitreAttack: e.target.value})}
                  >
                    <option value="">Select MITRE Tactic</option>
                    {MITRE_ATTACK_TACTICS.map(tactic => <option key={tactic} value={tactic}>{tactic}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input 
                    type="date"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Impact</label>
                <textarea 
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  rows={2}
                  value={formData.impact}
                  onChange={e => setFormData({...formData, impact: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remediation Steps</label>
                <textarea 
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  rows={3}
                  value={formData.remediationSteps}
                  onChange={e => setFormData({...formData, remediationSteps: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedFinding && (
        <FindingDetailModal 
          finding={selectedFinding} 
          onClose={() => {
            setIsDetailModalOpen(false);
            fetchData();
          }} 
        />
      )}
    </div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
