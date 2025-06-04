export interface SavedJobDTO {
  id: number;
  candidateId: number;
  jobId: string;
  jobTitle: string;
  companyName: string;
  savedAt: string;
  logoFileId: string;
  logoBase64: string;
  logoContentType: string;
  logoFileName: string;
}