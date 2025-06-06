import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { EmployerRegistration } from 'src/app/interfaces/EmployerRegistration';
import { RegistrationError } from 'src/app/interfaces/RegistrationError';
import { ValidationError } from 'src/app/interfaces/ValidationError';
import { RegistrationService } from 'src/app/services/registration.service';

@Component({
  selector: 'app-employeeregister',
  templateUrl: './employeeregister.component.html',
  styleUrls: ['./employeeregister.component.scss']
})
export class EmployeeregisterComponent {
   registrationForm: FormGroup;
  loading = false;
  
  companySizeOptions = [
    { label: '1-10 employees', value: '1-10' },
    { label: '11-50 employees', value: '11-50' },
    { label: '51-200 employees', value: '51-200' },
    { label: '201-1000 employees', value: '201-1000' },
    { label: '1000+ employees', value: '1000+' }
  ];

  industryOptions = [
    { label: 'Technology', value: 'Technology' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Education', value: 'Education' },
    { label: 'Manufacturing', value: 'Manufacturing' },
    { label: 'Retail', value: 'Retail' },
    { label: 'Consulting', value: 'Consulting' },
    { label: 'Other', value: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.registrationForm = this.createForm();
  }

  ngOnInit(): void {
    // Component initialization
  }

private createForm(): FormGroup {
  return this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    companyUniqueId: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: [''], // Optional field
    termsAccepted: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });
}

private passwordMatchValidator(form: FormGroup) {
  const password = form.get('password')?.value;
  const confirmPassword = form.get('confirmPassword');
  
  if (password && confirmPassword?.value && password !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  
  return null;
}

onSubmit(): void {
  if (this.registrationForm.valid) {
    this.loading = true;

    const formValue = this.registrationForm.value;
    const registrationData: EmployerRegistration = {
      email: formValue.email.trim(),
      password: formValue.password,
      companyUniqueId: formValue.companyUniqueId.trim(),
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName?.trim() || '', // Handle optional lastName
      termsAccepted: formValue.termsAccepted
    };

    // Submit registration
    this.registrationService.registerEmployer(registrationData).subscribe({
      next: (response) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Registration Successful',
          detail: 'Welcome! Your employer account has been created successfully.'
        });
        
        // Navigate to profile page
        setTimeout(() => {
          this.router.navigate(['/employer/dashboard']);
        }, 1500);
      },
      error: (error: RegistrationError) => {
        this.loading = false;
        console.error('Registration error:', error);
        this.handleRegistrationError(error);  
      }
    });
  } else {
    this.markFormGroupTouched();
    this.messageService.add({
      severity: 'error',
      summary: 'Form Invalid',
      detail: 'Please correct the errors in the form'
    });
  }
}

  private handleValidationErrors(errors: ValidationError[]): void {
    errors.forEach(error => {
      const control = this.registrationForm.get(error.field);
      if (control) {
        control.setErrors({ serverError: error.message });
      }
    });

    this.messageService.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please correct the highlighted fields'
    });
  }

  private handleRegistrationError(error: RegistrationError): void {
    if (error.validationErrors) {
      this.handleValidationErrors(error.validationErrors);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Registration Failed',
        detail: error.message
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

 getFieldError(fieldName: string): string {
  const field = this.registrationForm.get(fieldName);
  if (field && field.errors) {
    if (field.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
    }
    if (field.errors['passwordMismatch']) {
      return 'Passwords do not match';
    }
    if (field.errors['serverError']) {
      return field.errors['serverError'];
    }
  }
  return '';
}


  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      companyUniqueId: 'Company Unique Id',
    };
    return labels[fieldName] || fieldName;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToCandidateRegistration(): void {
    this.router.navigate(['/register/candidate']);
  }
}
