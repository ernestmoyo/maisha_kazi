import api from './axios';

export interface CoordinatorSummary {
  activeYouth: number;
  openJobs: number;
  completedThisWeek: number;
  totalEarnings: {
    totalFees: number;
    maishaCut: number;
    youthEarnings: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    serviceType: string;
    fee: number | null;
    createdAt: string;
    updatedAt: string;
    client: { id: string; name: string } | null;
    youth: { id: string; name: string } | null;
  }>;
}

export interface PlatformStats {
  totalJobs: number;
  completedJobs: number;
  totalYouth: number;
  totalClients: number;
  totalRevenue: number;
  averageRating: number;
}

export interface JobsByServiceType {
  serviceType: string;
  count: number;
}

export interface MonthlyCompletion {
  month: string;
  completed: number;
}

export interface YouthEarningsDistribution {
  range: string;
  count: number;
}

export interface ReportData {
  platformStats: PlatformStats;
  jobsByServiceType: JobsByServiceType[];
  monthlyCompletions: MonthlyCompletion[];
  youthEarningsDistribution: YouthEarningsDistribution[];
}

export function getCoordinatorSummary() {
  return api.get<CoordinatorSummary>('/reports/coordinator-summary');
}

export function getPlatformReports() {
  return api.get<ReportData>('/reports/platform-stats');
}

export function generateCSRReport(clientId: string) {
  return api.get(`/reports/csr/${clientId}`, { responseType: 'blob' });
}
