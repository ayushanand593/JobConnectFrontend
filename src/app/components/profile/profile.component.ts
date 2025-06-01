import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { EmailUpdateRequest } from 'src/app/interfaces/EmailUpdateRequest';
import { PasswordUpdateRequest } from 'src/app/interfaces/PasswordUpdateRequest';
import { User } from 'src/app/interfaces/User';
import { AuthService } from 'src/app/services/auth-service.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
  export class ProfileComponent {
  currentUser: User | null = null;
    emailForm: FormGroup;
    passwordForm: FormGroup;
     userRole: string | null = null;
    emailLoading = false;
    passwordLoading = false;
    showEmailDialog = false;
    showPasswordDialog = false;

    private destroy$ = new Subject<void>();

    constructor(
      private formBuilder: FormBuilder,
      private authService: AuthService,
      private messageService: MessageService,
      private confirmationService: ConfirmationService
    ) {
      this.emailForm = this.formBuilder.group({
        currentPassword: ['', [Validators.required]],
        newEmail: ['', [Validators.required, Validators.email]]
      });

      this.passwordForm = this.formBuilder.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      }, {
        validators: this.passwordMatchValidator
      });
    }

    ngOnInit(): void {
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
          this.userRole = this.currentUser?.role ?? null;
          if (user) {
            this.emailForm.patchValue({
              newEmail: user.email
            });
          }
        });
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    openEmailDialog(): void {
      this.emailForm.reset();
      this.emailForm.patchValue({
        newEmail: this.currentUser?.email || ''
      });
      this.showEmailDialog = true;
    }

    openPasswordDialog(): void {
      this.passwordForm.reset();
      this.showPasswordDialog = true;
    }

 updateEmail(): void {
  if (this.emailForm.invalid) {
    this.markFormGroupTouched(this.emailForm);
    return;
  }

  const emailUpdate: EmailUpdateRequest = {
    currentPassword: this.emailForm.get('currentPassword')?.value,
    newEmail: this.emailForm.get('newEmail')?.value
  };

  this.emailLoading = true;
  this.authService.updateEmail(emailUpdate)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.emailLoading = false;
        this.showEmailDialog = false;
        
        // Reset the form after successful update
        this.emailForm.reset();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Email updated successfully! Please LogIn Again'
        });
        setTimeout(() => {
          this.authService.logout();
        }, 2000); // 2 seconds delay so user can see the message
      },
      error: (errorMessage) => {
        this.emailLoading = false;
        console.error('Email update error:', errorMessage);
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage || 'Failed to update email'
        });
      }
    });
}

   updatePassword(): void {
  if (this.passwordForm.invalid) {
    this.markFormGroupTouched(this.passwordForm);
    return;
  }

  const passwordUpdate: PasswordUpdateRequest = {
    currentPassword: this.passwordForm.get('currentPassword')?.value,
    newPassword: this.passwordForm.get('newPassword')?.value
  };

  this.passwordLoading = true;
  this.authService.updatePassword(passwordUpdate)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.passwordLoading = false;
        this.showPasswordDialog = false;
        
        // Reset the form after successful update
        this.passwordForm.reset();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password updated successfully! Please login Again'
        });
         setTimeout(() => {
          this.authService.logout();
        }, 2000);
      },
      error: (errorMessage) => {
        this.passwordLoading = false;
        console.error('Password update error:', errorMessage);
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage || 'Failed to update password'
        });
      }
    });
}
    confirmLogout(): void {
      this.confirmationService.confirm({
        message: 'Are you sure you want to logout?',
        header: 'Confirm Logout',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.authService.logout();
          this.messageService.add({
            severity: 'info',
            summary: 'Logged Out',
            detail: 'You have been successfully logged out'
          });
        }
      });
    }

    private passwordMatchValidator(formGroup: FormGroup) {
      const newPassword = formGroup.get('newPassword');
      const confirmPassword = formGroup.get('confirmPassword');
      
      if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
      
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      
      return null;
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
      Object.keys(formGroup.controls).forEach(field => {
        const control = formGroup.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
    }

    isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
      const field = formGroup.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(formGroup: FormGroup, fieldName: string): string {
      const field = formGroup.get(fieldName);
      if (field?.errors) {
        if (field.errors['required']) {
          return `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
        }
        if (field.errors['email']) {
          return 'Please enter a valid email address';
        }
        if (field.errors['minlength']) {
          return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
        }
        if (field.errors['passwordMismatch']) {
          return 'Passwords do not match';
        }
      }
      return '';
  }
  }
