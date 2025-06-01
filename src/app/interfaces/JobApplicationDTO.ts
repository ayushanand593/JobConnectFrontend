import { ApplicationStatus } from "./ApplicationStatus";
import { DisclosureAnswerDTO } from "./DisclosureAnswerDTO";

export interface JobApplicationDTO {
  id: number;
  jobId: number;
  jobName:string;
  companyName:string;
  candidateId: number;
  resumeFileId: string;
  resumeFileName: string;
  coverLetterFileId: string;
  coverLetterFileName: string;
  status: ApplicationStatus;
  voluntaryDisclosures: string;
  disclosureAnswers: DisclosureAnswerDTO[];
  createdAt: Date;
  updatedAt: Date;
}