import { Finding } from '../types';

export const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'bg-red-900 text-white';
    case 'high': return 'bg-red-600 text-white';
    case 'medium': return 'bg-orange-500 text-white';
    case 'low': return 'bg-yellow-400 text-black';
    case 'informational': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open': return 'text-red-500 border-red-500';
    case 'in progress': return 'text-blue-500 border-blue-500';
    case 'closed': return 'text-green-500 border-green-500';
    case 'accepted risk': return 'text-purple-500 border-purple-500';
    default: return 'text-gray-500 border-gray-500';
  }
};

export const calculateSeverity = (cvss: number): Finding['severity'] => {
  if (cvss >= 9.0) return 'Critical';
  if (cvss >= 7.0) return 'High';
  if (cvss >= 4.0) return 'Medium';
  if (cvss >= 0.1) return 'Low';
  return 'Informational';
};
