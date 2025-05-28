import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { JwtResponse } from 'src/app/interfaces/JwtResponse';
import { LoginRequest } from 'src/app/interfaces/LoginRequest';
import { AuthService } from 'src/app/services/auth-service.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
loginForm: FormGroup;
  loading = false;
  returnUrl: string = '/dashboard';
  showTermsDialog = false;
  pendingLoginRequest: LoginRequest | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const loginRequest: LoginRequest = {
      email: this.f['email'].value,
      password: this.f['password'].value,
      termsAccepted:this.f['termsAccepted'].value
    };

    this.authService.login(loginRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JwtResponse) => {
          this.handleLoginResponse(response, loginRequest);
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: error || 'Invalid credentials'
          });
        }
      });
  }

  private handleLoginResponse(response: JwtResponse, originalRequest: LoginRequest): void {
    if (response.requiresTermsAcceptance) {
      // User needs to accept terms
      this.loading = false;
      this.pendingLoginRequest = originalRequest;
      this.showTermsDialog = true;
    } else if (response.token && response.user) {
      // Successful login
      this.loading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Login successful!'
      });
      this.router.navigate([this.returnUrl]);
    } else if (response.error) {
      // Handle other errors
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: response.message || 'Login failed'
      });
    }
  }

  onAcceptTerms(): void {
    if (!this.pendingLoginRequest) return;

    this.loading = true;
    this.showTermsDialog = false;
    
    const loginWithTerms: LoginRequest = {
      ...this.pendingLoginRequest,
      termsAccepted: true
    };

    this.authService.login(loginWithTerms)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JwtResponse) => {
          this.loading = false;
          if (response.token && response.user) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Welcome! Terms accepted and login successful.'
            });
            this.router.navigate([this.returnUrl]);
          }
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error || 'Login failed after accepting terms'
          });
        }
      });

    this.pendingLoginRequest = null;
  }

  onRejectTerms(): void {
    this.showTermsDialog = false;
    this.pendingLoginRequest = null;
    this.messageService.add({
      severity: 'warn',
      summary: 'Terms Required',
      detail: 'You must accept the terms and conditions to continue.'
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(field => {
      const control = this.loginForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
} 
