import { JobStats } from "./JobStats";

export interface EmployerDashboardStats {
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalApplications: number;
  newApplications: number;
  shortlistedApplications: number;
  rejectedApplications: number;
  applicationTrend: { [key: string]: number };
  topJobs: JobStats[];
  applicationStatusDistribution: { [key: string]: number };
  jobTypeDistribution: { [key: string]: number };
}