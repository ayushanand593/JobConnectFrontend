import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { JwtResponse } from 'src/app/interfaces/JwtResponse';
import { CandidateRegistration } from 'src/app/interfaces/CandidateRegistration';
import { AuthService } from 'src/app/services/auth-service.service';
import { RegistrationService } from 'src/app/services/registration.service';
import { RegistrationError } from 'src/app/interfaces/RegistrationError';
import { ValidationError } from 'src/app/interfaces/ValidationError';

@Component({
  selector: 'app-candidateregister',
  templateUrl: './candidateregister.component.html',
  styleUrls: ['./candidateregister.component.scss']
})
export class CandidateregisterComponent implements OnInit {
  registrationForm: FormGroup;
  loading = false;
  filteredSkills: string[] = [];
  skillsArray: string[] = [];

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.registrationForm = this.createForm();
  }

  ngOnInit(): void {
    // Initialize filtered skills
    this.filteredSkills = [...this.skillsArray];
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: [''],
      phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      headline: ['', [Validators.maxLength(100)]],
      summary: ['', [Validators.maxLength(500)]],
      experienceYears: [null, [Validators.min(0), Validators.max(50)]],
      termsAccepted: [false, [Validators.requiredTrue]],
       skills: [[]],
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

onSkillAdd(event: any): void {
  // For p-chips onAdd event (if using chips instead)
  const skill = event.value?.trim();
  if (!skill) return;
  
  const skillsControl = this.registrationForm.get('skills');
  if (!skillsControl) return;
  
  const currentSkills: string[] = skillsControl.value || [];
  
  // Check for duplicate (case-insensitive)
  if (currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
    // Remove the duplicate that was just added
    const updatedSkills = currentSkills.slice(0, -1);
    skillsControl.setValue(updatedSkills);
    
    this.messageService.add({
      severity: 'warn',
      summary: 'Duplicate Skill',
      detail: `"${skill}" already exists`
    });
  }
}

addSkillFromInput(event: any): void {
  const input = event.target;
  const value = input.value.trim();
  
  if (value) {
    // Format skill with first letter capitalized
    const formattedSkill = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    
    // Check for duplicates case-insensitively
    if (!this.skillsArray.some(skill => skill.toLowerCase() === formattedSkill.toLowerCase())) {
      this.skillsArray.push(formattedSkill);
      // Update the form control with the new array
      this.registrationForm.patchValue({ skills: this.skillsArray });
    }
    
    // Clear the input
    input.value = '';
    event.preventDefault();
  }
}

// Also update removeSkillByIndex to sync with form control:
removeSkillByIndex(index: number): void {
  this.skillsArray.splice(index, 1);
  // Update the form control after removing skill
  this.registrationForm.patchValue({ skills: this.skillsArray });
}

// Keep these existing methods but make sure they work with skillsArray
addSkill(event: any): void {
  const input = event.input;
  const value = event.value?.trim();
  
  if (value && !this.skillsArray.includes(value)) {
    this.skillsArray.push(value);
  }
  
  if (input) {
    input.value = '';
  }
}

removeSkill(skill: string): void {
  const index = this.skillsArray.indexOf(skill);
  if (index >= 0) {
    this.skillsArray.splice(index, 1);
  }
}

onSubmit(): void {
  this.markFormGroupTouched();

   if (this.registrationForm.invalid) {
    // Show specific validation errors in toast
    const errorMessages = this.getFormValidationErrors();
    
    errorMessages.forEach(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: error
      });
    });
    return;
  }
    if (this.registrationForm.valid) {
      this.loading = true;

      const fv = this.registrationForm.value;
      const registrationData: CandidateRegistration = {
        email: fv.email.trim(),
        password: fv.password,
        firstName: fv.firstName.trim(),
        lastName: fv.lastName?.trim() || undefined,
        phone: fv.phone?.trim() || undefined,
        headline: fv.headline?.trim() || undefined,
        summary: fv.summary?.trim() || undefined,
        experienceYears: fv.experienceYears || undefined,
        // since `skills` is already a string[] in the form, we pass it
         skills: this.skillsArray.length > 0 ? this.skillsArray : undefined,
        termsAccepted: fv.termsAccepted
      };

      // … the rest of your validation & HTTP‐call logic stays the same …
      const validationErrors = this.registrationService.validateCandidateData(registrationData);
      if (validationErrors.length > 0) {
        this.handleValidationErrors(validationErrors);
        this.loading = false;
        return;
      }

      this.registrationService.registerCandidate(registrationData).subscribe({
        next: (response: JwtResponse) => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Registration Successful',
            detail: 'Welcome! Your account has been created successfully.'
          });
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 1500);
        },
        error: (error: RegistrationError) => {
          this.loading = false;
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

private getFormValidationErrors(): string[] {
  const errors: string[] = [];
  Object.keys(this.registrationForm.controls).forEach(key => {
    const control = this.registrationForm.get(key);
    if (control?.errors) {
      if (control.errors['required']) {
        errors.push(`${this.getFieldLabel(key)} is required`);
      }
      if (control.errors['email']) {
        errors.push('Please enter a valid email address');
      }
      if (control.errors['minlength']) {
        const reqLength = control.errors['minlength'].requiredLength;
        errors.push(`${this.getFieldLabel(key)} must be at least ${reqLength} characters`);
      }
      if (control.errors['passwordMismatch']) {
        errors.push('Passwords do not match');
      }
      // Add any other specific error messages you need
    }
  });
  return errors;
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
//   handleEnterKey(event: any): void {
//   const input = (event.target as HTMLInputElement).value?.trim();
//   if (input && !this.selectedSkills.includes(input)) {
//     this.selectedSkills.push(input);
//     this.registrationForm.get('skills')?.setValue(this.selectedSkills);
//   }
//   // Clear the input if needed (for p-autoComplete, may need to reset ngModel)
//   (event.target as HTMLInputElement).value = '';
//   event.preventDefault();
// }

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
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} cannot be negative`;
      }
      if (field.errors['max']) {
        return `${this.getFieldLabel(fieldName)} cannot exceed 50 years`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number';
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
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone',
      headline: 'Headline',
      summary: 'Summary',
      experienceYears: 'Experience Years'
    };
    return labels[fieldName] || fieldName;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Track function for ngFor performance
  trackBySkill(index: number, skill: string): string {
    return skill;
  }
}

