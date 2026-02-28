import React, { useEffect, useState } from 'react';
import { Finding } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Upload, Trash2, Download, FileText, Calendar, Shield, AlertCircle } from 'lucide-react';
import { getSeverityColor, getStatusColor } from '../utils/helpers';

interface Evidence {
  id: number;
  findingId: number;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

interface FindingDetailModalProps {
  finding: Finding;
  onClose: () => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({ finding, onClose }) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchEvidence();
  }, [finding.id]);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/findings/${finding.id}/evidence`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setEvidence(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('evidence', file);
    const res = await fetch(`/api/findings/${finding.id}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) fetchEvidence();
  };

  const handleDeleteEvidence = async (id: number) => {
    if (confirm('Are you sure you want to delete this evidence?')) {
      const res = await fetch(`/api/evidence/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchEvidence();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{finding.findingId}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getSeverityColor(finding.severity)}`}>
                {finding.severity}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{finding.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <section>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                <AlertCircle size={16} className="mr-2 text-blue-500" /> Description
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                {finding.description || 'No description provided.'}
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                <Shield size={16} className="mr-2 text-emerald-500" /> Remediation Steps
              </h4>
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-emerald-900 leading-relaxed whitespace-pre-wrap">
                {finding.remediationSteps || 'No remediation steps provided.'}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <FileText size={16} className="mr-2 text-purple-500" /> Evidence List
                </h4>
                {['Admin', 'Security Analyst'].includes(user?.role || '') && (
                  <label className="cursor-pointer flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold">
                    <Upload size={14} className="mr-2" /> Upload Evidence
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  </label>
                )}
              </div>

              {loading ? (
                <div className="text-slate-400 text-sm italic">Loading evidence...</div>
              ) : evidence.length === 0 ? (
                <div className="text-slate-400 text-sm italic bg-slate-50 p-8 rounded-xl border border-dashed border-slate-200 text-center">
                  No evidence files uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {evidence.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow group">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 mr-4">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{item.fileName}</p>
                          <p className="text-[10px] text-slate-400">{new Date(item.uploadedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={item.filePath} 
                          download={item.fileName}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        {['Admin', 'Security Analyst'].includes(user?.role || '') && (
                          <button 
                            onClick={() => handleDeleteEvidence(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata</h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Application</span>
                  <span className="text-xs font-semibold text-slate-900">{finding.appName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(finding.status)}`}>
                    {finding.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">CVSS Score</span>
                  <span className="text-xs font-bold text-slate-900">{finding.cvssScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">OWASP Category</span>
                  <span className="text-xs font-medium text-slate-700">{finding.owaspCategory || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">MITRE ATT&CK</span>
                  <span className="text-xs font-medium text-slate-700">{finding.mitreAttack || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 flex items-center">
                    <Calendar size={12} className="mr-1" /> Due Date
                  </span>
                  <span className="text-xs font-medium text-slate-700">{finding.dueDate || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
              <h5 className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2">Risk Score</h5>
              <div className="text-4xl font-black mb-1">{finding.riskScore || (finding.cvssScore * 10)}</div>
              <p className="text-[10px] text-blue-100">Calculated based on CVSS and Impact</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
