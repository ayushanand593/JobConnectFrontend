import { DisclosureQuestion } from "./DisclosureQuestion";

export interface JobDisclosureQuestionsDTO {
  jobId: string;
  jobTitle: string;
  companyName: string;
  disclosureQuestions: DisclosureQuestion[];
}