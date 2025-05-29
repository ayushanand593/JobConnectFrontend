import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, Subject, tap, throwError } from 'rxjs';
import { CandidateRegistration } from '../interfaces/CandidateRegistration';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtResponse } from '../interfaces/JwtResponse';
import { RegistrationError } from '../interfaces/RegistrationError';
import { ValidationError } from '../interfaces/ValidationError';
import { AuthService } from './auth-service.service';
import { EmployerRegistration } from '../interfaces/EmployerRegistration';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

private readonly API_URL = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Register a new candidate
   */
  registerCandidate(candidateData: CandidateRegistration): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.API_URL}/candidate/register`, candidateData)
      .pipe(
        tap(response => {
          // Auto-login after successful registration
          if (response.token && response.user) {
            this.authService['setSession'](response.token, response.user);
          }
        }),
        catchError(this.handleRegistrationError)
      );
  }

  /**
   * Register a new employer (placeholder for future implementation)
   */
    registerEmployer(employerData: EmployerRegistration): Observable<JwtResponse> {
    // ✅ Fixed: Using template literals with backticks
    return this.http.post<JwtResponse>(`${this.API_URL}/employer/register`, employerData)
      .pipe(
        tap(response => {
          if (response.token && response.user) {
            this.authService.setSession(response.token, response.user);
          }
        }),
        catchError(this.handleRegistrationError)
      );
  }

  /**
   * Check if email is already registered
   */
  checkEmailAvailability(email: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.API_URL}/check-email`, {
      params: { email }
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Validate registration data before submission
   */
  validateCandidateData(data: CandidateRegistration): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (!data.password || data.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }

    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'First name is required' });
    }

    if (!data.termsAccepted) {
      errors.push({ field: 'termsAccepted', message: 'You must accept the terms and conditions' });
    }

    return errors;
  }

  /**
   * Validate employer registration data
   */
  validateEmployerData(data: EmployerRegistration): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (!data.password || data.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }

    if (!data.companyUniqueId || data.companyUniqueId.trim().length === 0) {
      errors.push({ field: 'companyUniqueId', message: 'Company Unique Id is required' });
    }
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'First name is required' });
    }
    // if (!data.lastName || data.lastName.trim().length === 0) {
    //   errors.push({ field: 'firstName', message: 'First name is required' });
    // }

    if (!data.termsAccepted) {
      errors.push({ field: 'termsAccepted', message: 'You must accept the terms and conditions' });
    }

    return errors;
  }

  /**
   * Handle registration-specific errors
   */
  private handleRegistrationError(error: HttpErrorResponse) {
    let errorMessage = 'Registration failed. Please try again.';
    let validationErrors: ValidationError[] = [];

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 400) {
        // Validation errors
        if (error.error && error.error.validationErrors) {
          validationErrors = error.error.validationErrors;
          errorMessage = 'Please correct the validation errors';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
      } else if (error.status === 409) {
        // Conflict (email already exists)
        errorMessage = error.error?.message || 'Email already registered';
        validationErrors = [{ field: 'email', message: errorMessage }];
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    const registrationError: RegistrationError = {
      message: errorMessage,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    };

    return throwError(() => registrationError);
  }

  /**
   * Generic error handler
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    return throwError(() => errorMessage);
  }

  /**
   * Email validation helper
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
