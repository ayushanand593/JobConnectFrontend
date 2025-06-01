import { Skill } from "./Skill";

export interface CandidateProfileDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  headline: string;
  summary: string;
  experienceYears: number;
  resumeFileId: string;
  resumeFileName: string;
  skills: Skill[];
  createdAt: Date;
}