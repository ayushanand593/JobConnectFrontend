import { DisclosureAnswerDTO } from "./DisclosureAnswerDTO";

export interface JobApplicationSubmissionDTO {
  jobId: number;
  useExistingResume?: boolean;
  voluntaryDisclosures?: string;
  disclosureAnswers?: DisclosureAnswerDTO[];
}