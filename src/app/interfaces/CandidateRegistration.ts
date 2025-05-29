export interface CandidateRegistration{
      
        email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  headline?: string;
  summary?: string;
  experienceYears?: number;
  skills?: string[];
  termsAccepted: boolean;
 
}