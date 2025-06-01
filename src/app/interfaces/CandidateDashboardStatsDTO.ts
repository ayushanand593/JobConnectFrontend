import { ApplicationSummaryDTO } from "./ApplicationSummaryDTO";

export interface CandidateDashboardStatsDTO {
  totalApplications: number;
  applicationsByStatus: { [key: string]: number };
  recentApplications: ApplicationSummaryDTO[];
  applicationTrendByDate: { [key: string]: number };
}