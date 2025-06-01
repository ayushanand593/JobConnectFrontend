import { ApplicationStatus } from "./ApplicationStatus";
import { DisclosureAnswerDTO } from "./DisclosureAnswerDTO";

export interface JobApplication {
  id: number;
  jobId: number;
  jobName: string;
  companyName: string;
  candidateId: number;
  candidateName?: string;
  candidateEmail?: string;
  resumeFileId?: string;
  resumeFileName?: string;
  coverLetterFileId?: string;
  coverLetterFileName?: string;
  status: ApplicationStatus;
  voluntaryDisclosures?: string;
  disclosureAnswers?: DisclosureAnswerDTO[];
  createdAt: Date;
  updatedAt: Date;
}
