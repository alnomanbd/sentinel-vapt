import React, { useEffect, useState } from 'react';
import { Finding } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Upload, Trash2, Download, FileText, Calendar, Shield, AlertCircle, MessageSquare, Send, User } from 'lucide-react';
import { getSeverityColor, getStatusColor } from '../utils/helpers';

interface Evidence {
  id: number;
  findingId: number;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

interface Comment {
  id: number;
  findingId: number;
  userId: number;
  userName: string;
  text: string;
  attachmentPath?: string;
  attachmentType?: string;
  createdAt: string;
}

interface FindingDetailModalProps {
  finding: Finding;
  onClose: () => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({ finding, onClose }) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchEvidence();
    fetchComments();
  }, [finding.id]);

  const fetchEvidence = async () => {
    try {
      const res = await fetch(`/api/findings/${finding.id}/evidence`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setEvidence(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/findings/${finding.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !attachment) return;

    const formData = new FormData();
    formData.append('text', newComment);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    const res = await fetch(`/api/findings/${finding.id}/comments`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (res.ok) {
      setNewComment('');
      setAttachment(null);
      fetchComments();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-100 dark:border-slate-800 transition-all duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{finding.findingId}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getSeverityColor(finding.severity)}`}>
                {finding.severity}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{finding.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center">
                <AlertCircle size={16} className="mr-2 text-blue-500" /> Description
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                {finding.description || 'No description provided.'}
              </p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center">
                <Shield size={16} className="mr-2 text-emerald-500" /> Remediation Steps
              </h4>
              <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-400 leading-relaxed whitespace-pre-wrap">
                {finding.remediationSteps || 'No remediation steps provided.'}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center">
                  <FileText size={16} className="mr-2 text-purple-500" /> Evidence List
                </h4>
                {['Admin', 'Security Analyst'].includes(user?.role || '') && (
                  <label className="cursor-pointer flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs font-semibold">
                    <Upload size={14} className="mr-2" /> Upload Evidence
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  </label>
                )}
              </div>

              {loading ? (
                <div className="text-slate-400 text-sm italic">Loading evidence...</div>
              ) : evidence.length === 0 ? (
                <div className="text-slate-400 text-sm italic bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  No evidence files uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {evidence.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow group">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 mr-4">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">{item.fileName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(item.uploadedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={item.filePath} 
                          download={item.fileName}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        {['Admin', 'Security Analyst'].includes(user?.role || '') && (
                          <button 
                            onClick={() => handleDeleteEvidence(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

            <section>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center">
                  <MessageSquare size={16} className="mr-2 text-blue-500" /> Discussion
                </h4>
              </div>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 text-sm italic">No comments yet. Start the discussion!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className={`flex flex-col ${comment.userId === user?.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 ${comment.userId === user?.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-[10px] font-bold ${comment.userId === user?.id ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{comment.userName}</span>
                          <span className={`text-[10px] ${comment.userId === user?.id ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                        {comment.attachmentPath && (
                          <div className="mt-2 pt-2 border-t border-white/10 dark:border-slate-700">
                            {comment.attachmentType?.startsWith('image/') ? (
                              <img 
                                src={comment.attachmentPath} 
                                alt="Attachment" 
                                className="max-w-full rounded-lg border border-white/20 dark:border-slate-700 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <a 
                                href={comment.attachmentPath} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`flex items-center text-xs font-bold p-2 rounded-lg ${comment.userId === user?.id ? 'bg-blue-700 text-white' : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700'}`}
                              >
                                <FileText size={14} className="mr-2" />
                                Download Attachment
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="relative">
                <div className="flex flex-col space-y-2">
                  {attachment && (
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center text-xs text-blue-700 dark:text-blue-400 font-medium truncate">
                        <FileText size={14} className="mr-2" />
                        {attachment.name}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setAttachment(null)}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      className="w-full pl-4 pr-24 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      <label className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer transition-colors">
                        <Upload size={18} />
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => e.target.files?.[0] && setAttachment(e.target.files[0])} 
                        />
                      </label>
                      <button 
                        type="submit"
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Metadata</h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Application</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{finding.appName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(finding.status)}`}>
                    {finding.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">CVSS Score</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{finding.cvssScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">OWASP Category</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{finding.owaspCategory || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">MITRE ATT&CK</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{finding.mitreAttack || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                    <Calendar size={12} className="mr-1" /> Due Date
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{finding.dueDate || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
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
