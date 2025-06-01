import { Component, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { CandidateDashboardStatsDTO } from 'src/app/interfaces/CandidateDashboardStatsDTO';
import { CandidateProfileDTO } from 'src/app/interfaces/CandidateProfileDTO';
import { CandidateProfileUpdateDTO } from 'src/app/interfaces/CandidateProfileUpdateDTO';
import { JobApplicationDTO } from 'src/app/interfaces/JobApplicationDTO';
import { PageResponse } from 'src/app/interfaces/PageResponse';
import { CandidateService } from 'src/app/services/candidate-service.service';

@Component({
  selector: 'app-candidate',
  templateUrl: './candidate.component.html',
  styleUrls: ['./candidate.component.scss']
})
export class CandidateComponent {
@ViewChild('fileUpload') fileUpload!: FileUpload;

  // Data properties
  candidateProfile: CandidateProfileDTO | null = null;
  dashboardStats: CandidateDashboardStatsDTO | null = null;
  jobApplications: JobApplicationDTO[] = [];
  skillsArray: string[] = [];
  // Loading states
  loading = false;
  loadingProfile = false;
  loadingApplications = false;
  loadingDashboard = false;
  
  // Dialog states
  showUpdateProfileDialog = false;
  showResumeUploadDialog = false;
  
  // Forms
  profileUpdateForm: FormGroup;
  
  // Pagination
  totalApplications = 0;
  currentPage = 0;
  pageSize = 10;
  
  // File upload
  uploadedFiles: File[] = [];
  maxFileSize = 5000000; // 5MB
  acceptedFileTypes = '.pdf,.doc,.docx,.txt';

  constructor(
    private candidateService: CandidateService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.profileUpdateForm = this.createProfileForm();
  }

  ngOnInit(): void {
    this.loadCandidateProfile();
    this.loadDashboardStats();
    this.loadJobApplications();
  }

  // Form creation
  private createProfileForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: [''],
      phone: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      headline: ['', [Validators.maxLength(200)]],
      summary: ['', [Validators.maxLength(1000)]],
      experienceYears: [null, [Validators.min(0), Validators.max(50)]],
      // skills: this.fb.array([])
    });
  }

  // Data loading methods
  loadCandidateProfile(): void {
    this.loadingProfile = true;
    this.candidateService.getCandidateProfile().subscribe({
      next: (profile) => {
        this.candidateProfile = profile;
        this.populateProfileForm(profile);
        this.loadingProfile = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load profile information'
        });
        this.loadingProfile = false;
      }
    });
  }

  loadDashboardStats(): void {
    this.loadingDashboard = true;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    this.candidateService.getDashboardStats(startDate, endDate).subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.loadingDashboard = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load dashboard statistics'
        });
        this.loadingDashboard = false;
      }
    });
  }

  loadJobApplications(page: number = 0): void {
    this.loadingApplications = true;
    this.candidateService.getMyApplications(page, this.pageSize).subscribe({
      next: (response: PageResponse<JobApplicationDTO>) => {
        console.log(response.content)
        this.jobApplications = response.content;
        this.totalApplications = response.totalElements;
        this.currentPage = response.number;
        this.loadingApplications = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load job applications'
        });
        this.loadingApplications = false;
      }
    });
  }

  // Profile management
  openUpdateProfileDialog(): void {
    if (this.candidateProfile) {
      this.populateProfileForm(this.candidateProfile);
      this.skillsArray = this.candidateProfile.skills ? this.candidateProfile.skills.map(skill => skill.name) : [];
    }
    this.showUpdateProfileDialog = true;
  }

  private populateProfileForm(profile: CandidateProfileDTO): void {
    this.profileUpdateForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      headline: profile.headline,
      summary: profile.summary,
      experienceYears: profile.experienceYears,
      skills: profile.skills?.map(skill => skill.name) || []
    });
  }

  updateProfile(): void {
    if (this.profileUpdateForm.valid) {
      this.loading = true;
      const formValue = this.profileUpdateForm.value;

      const updateData: CandidateProfileUpdateDTO = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        headline: formValue.headline,
        summary: formValue.summary,
        experienceYears: formValue.experienceYears,
        resumeUrl: '', // Not used in current implementation
        skills: this.skillsArray
      };

      this.candidateService.updateCandidateProfile(updateData).subscribe({
        next: (updatedProfile) => {
          this.candidateProfile = updatedProfile;
          this.showUpdateProfileDialog = false;
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully'
          });
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update profile'
          });
        }
      });
    } else {
      this.markFormGroupTouched(this.profileUpdateForm);
    }
  }
  get skillsFormArray(): FormArray {
  return this.profileUpdateForm.get('skills') as FormArray;
}

  // Resume upload
  openResumeUploadDialog(): void {
    this.showResumeUploadDialog = true;
    this.uploadedFiles = [];
  }

  onFileSelect(event: any): void {
    console.log(event.currentFiles)
    this.uploadedFiles = event.currentFiles;
  }
  onFileClear(): void {
    this.uploadedFiles = [];
  }

  uploadResume(): void {
    if (this.uploadedFiles.length > 0) {
      this.loading = true;
      const file = this.uploadedFiles[0];
      const formData = new FormData();
    formData.append('resume', file, file.name);
      
      this.candidateService.uploadResume(file).subscribe({
        next: (updatedProfile) => {
          this.candidateProfile = updatedProfile;
          this.showResumeUploadDialog = false;
          this.loading = false;
          this.uploadedFiles = [];
          this.fileUpload.clear();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Resume uploaded successfully'
          });
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to upload resume'
          });
        }
      });
    }
  }
 addSkillFromInput(event: any): void {
  const input = event.target;
  const value = input.value.trim();
  
  if (value && !this.skillsArray.includes(value)) {
    this.skillsArray.push(value);
    input.value = '';
    event.preventDefault();
  }
}

removeSkillByIndex(index: number): void {
  this.skillsArray.splice(index, 1);
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

  // Pagination
  onPageChange(event: any): void {
    this.loadJobApplications(event.page);
  }

  // Utility methods
  getStatusCount(status: string): number {
    return this.dashboardStats?.applicationsByStatus[status] || 0;
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'danger';
      case 'REVIEWED': return 'info';
      case 'SHORTLISTED': return 'warning';
      case 'INTERVIEWED': return 'warning';
      case 'PENDING': return 'secondary';
      default: return 'secondary';
    }
  }

  getApplicationStatusIcon(status: string): string {
    switch (status) {
      case 'ACCEPTED': return 'pi pi-check-circle';
      case 'REJECTED': return 'pi pi-times-circle';
      case 'REVIEWED': return 'pi pi-eye';
      case 'SHORTLISTED': return 'pi pi-star';
      case 'INTERVIEWED': return 'pi pi-users';
      case 'PENDING': return 'pi pi-clock';
      default: return 'pi pi-circle';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileUpdateForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileUpdateForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
      if (field.errors['min']) return `${fieldName} must be greater than or equal to ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be less than or equal to ${field.errors['max'].max}`;
    }
    return '';
  }

  // Cancel actions
  cancelProfileUpdate(): void {
    this.showUpdateProfileDialog = false;
    this.profileUpdateForm.reset();
  }

  cancelResumeUpload(): void {
    this.showResumeUploadDialog = false;
    this.uploadedFiles = [];
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }
}
