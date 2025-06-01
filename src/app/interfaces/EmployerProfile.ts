export interface EmployerProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  companyId: number;
  profilePictureUrl?: string;
}