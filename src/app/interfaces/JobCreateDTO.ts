import { DisclosureQuestion } from "./DisclosureQuestion";

export interface JobCreateDTO {
  title: string;
  location: string;
  jobType: string;
  experienceLevel?: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  salaryRange?: string;
  skills?: string[];
  applicationDeadline?: string; // ISO date string
  disclosureQuestions?: DisclosureQuestion[];
}