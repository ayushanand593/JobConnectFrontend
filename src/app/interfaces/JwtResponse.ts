import { User } from "./User";

export interface JwtResponse {
  token?: string;
  tokenType?: string;
  user?: User;
  error?: string;
  message?: string;
  requiresTermsAcceptance?: boolean;
}