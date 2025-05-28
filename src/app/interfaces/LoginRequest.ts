export interface LoginRequest {
  email: string;
  password: string;
  termsAccepted?: boolean;
}