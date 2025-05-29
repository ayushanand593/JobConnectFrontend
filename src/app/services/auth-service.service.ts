import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { User } from '../interfaces/User';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { EmailUpdateRequest } from '../interfaces/EmailUpdateRequest';
import { JwtResponse } from '../interfaces/JwtResponse';
import { LoginRequest } from '../interfaces/LoginRequest';
import { PasswordUpdateRequest } from '../interfaces/PasswordUpdateRequest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

    login(loginRequest: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => {
          if (response.token && response.user) {
            this.setSession(response.token, response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

   logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  

updateEmail(emailUpdate: EmailUpdateRequest): Observable<any> {
  return this.http
    .put(`${this.API_URL}/update-email`, emailUpdate, { 
      responseType: 'text' 
    })
    .pipe(
      tap((response) => {
        // Update the stored user email only after successful response
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          currentUser.email = emailUpdate.newEmail;
          localStorage.setItem(this.USER_KEY, JSON.stringify(currentUser));
          this.currentUserSubject.next({ ...currentUser }); // spread to ensure change detection
        }
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('UpdateEmail error:', err);
        
        // Extract error message from different possible response structures
        let errorMessage = 'Failed to update email';
        
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        return throwError(() => errorMessage);
      })
    );
}


updatePassword(passwordUpdate: PasswordUpdateRequest): Observable<any> {
  return this.http
    .put(`${this.API_URL}/update-password`, passwordUpdate, { 
      responseType: 'text' 
    })
    .pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('UpdatePassword error:', err);
        
        // Extract error message from different possible response structures
        let errorMessage = 'Failed to update password';
        
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        return throwError(() => errorMessage);
      })
    );
}
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // Public method for registration service to access
  public setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }

    return throwError(() => errorMessage);
  }
}

