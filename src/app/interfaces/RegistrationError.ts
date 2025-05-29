import { ValidationError } from "./ValidationError";

export interface RegistrationError {
  message: string;
  validationErrors?: ValidationError[];
}