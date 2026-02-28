export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Security Analyst' | 'Developer' | 'App Owner' | 'Management' | 'Viewer';
}

export interface Application {
  id: number;
  appId: string;
  name: string;
  owner: string;
  environment: 'Prod' | 'UAT' | 'Dev';
  description?: string;
}

export interface Finding {
  id: number;
  findingId: string;
  appId: string;
  appName?: string;
  title: string;
  description: string;
  impact: string;
  cvssScore: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  owaspCategory: string;
  mitreAttack?: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Accepted Risk';
  assignedTo?: number;
  reportedDate: string;
  dueDate: string;
  remediationSteps: string;
  riskScore: number;
  evidenceFile?: string;
}

export interface DashboardStats {
  total: number;
  open: number;
  overdue: number;
  severityStats: { severity: string; count: number }[];
  statusStats: { status: string; count: number }[];
}
