import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#991b1b', '#dc2626', '#f97316', '#facc15', '#3b82f6'];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetch('/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setStats(data));
  }, [token]);

  if (!stats) return <div className="p-8 text-slate-400">Loading dashboard...</div>;

  const kpis = [
    { label: 'Total Findings', value: stats.total, icon: Shield, color: 'text-blue-500' },
    { label: 'Open Findings', value: stats.open, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Closed Findings', value: stats.total - stats.open, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Overdue (SLA)', value: stats.overdue, icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 transition-colors duration-300">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Security Overview</h2>
        <p className="text-slate-500 dark:text-slate-400">Enterprise VAPT Metrics & Risk Summary</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-all duration-300">
            <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${kpi.color}`}>
              <kpi.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Severity Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.severityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                  dataKey="severity" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }}
                  itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Status Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {stats.statusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
