export interface JobSearchRequest {
  companyName?: string;
  jobTitle?: string;
  location?: string;
  skills?: string[];
  experienceLevel?: string;
  jobType?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}