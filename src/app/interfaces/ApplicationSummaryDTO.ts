export interface ApplicationSummaryDTO {
  id: number;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: string;
  appliedDate: Date;
  lastUpdated: Date;
}