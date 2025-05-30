import { DisclosureQuestion } from "./DisclosureQuestion";
import { Skill } from "./Skill";

export interface Job {
  id: number;
  jobId: string;
  title: string;
  companyName: string;
  companyId: number;
  location: string;
  jobType: string;
  experienceLevel: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salaryRange: string;
  applicationDeadline: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
  disclosureQuestions: DisclosureQuestion[];
}