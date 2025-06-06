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
  skillSuggestions: string[] = [
    'JavaScript', 'TypeScript', 'Angular', 'React', 'Vue.js', 'Node.js',
    'Java', 'Spring Boot', 'Python', 'Django', 'Flask', 'C#', '.NET',
    'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'Swift',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'Google Cloud', 'Git', 'Jenkins', 'CI/CD'
  ];
  filteredSkills: string[] = [];
  selectedSkills: string[] = [];

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
    this.filteredSkills = [...this.skillSuggestions];
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

  onSkillSelect(event: any): void {
    const skill = event.value;
    if (skill && !this.selectedSkills.includes(skill)) {
      this.selectedSkills.push(skill);
    }
  }

  removeSkill(skillToRemove: string): void {
    this.selectedSkills = this.selectedSkills.filter(skill => skill !== skillToRemove);
  }

  filterSkills(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredSkills = this.skillSuggestions.filter(skill => 
      skill.toLowerCase().includes(query) && !this.selectedSkills.includes(skill)
    );
  }

onSubmit(): void {
  if (this.registrationForm.valid) {
    this.loading = true;
    const formValue = this.registrationForm.value;
    const registrationData: CandidateRegistration = {
      email: formValue.email.trim(),
      password: formValue.password,
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName?.trim() || undefined,
      phone: formValue.phone?.trim() || undefined,
      headline: formValue.headline?.trim() || undefined,
      summary: formValue.summary?.trim() || undefined,
      experienceYears: formValue.experienceYears || undefined,
      skills: this.selectedSkills.length > 0 ? this.selectedSkills : undefined,
      termsAccepted: formValue.termsAccepted
    };

    // Client-side validation
      const validationErrors = this.registrationService.validateCandidateData(registrationData);
    if (validationErrors.length > 0) {
      this.handleValidationErrors(validationErrors);
      this.loading = false;
      return;
    }

    this.registrationService.registerCandidate(registrationData).subscribe({
      next: (response) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Registration Successful',
          detail: 'Welcome! Your account has been created successfully.'
        });
        // Only navigate when registration is successful
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 1500);
      },
         error: (error: RegistrationError) => {
        this.loading = false;
        console.error('Registration error:', error); // For debugging
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
  handleEnterKey(event: any): void {
  const input = (event.target as HTMLInputElement).value?.trim();
  if (input && !this.selectedSkills.includes(input)) {
    this.selectedSkills.push(input);
    this.registrationForm.get('skills')?.setValue(this.selectedSkills);
  }
  // Clear the input if needed (for p-autoComplete, may need to reset ngModel)
  (event.target as HTMLInputElement).value = '';
  event.preventDefault();
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

