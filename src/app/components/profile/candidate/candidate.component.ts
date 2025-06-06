import { Component, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Subject, takeUntil } from 'rxjs';
import { CandidateDashboardStatsDTO } from 'src/app/interfaces/CandidateDashboardStatsDTO';
import { CandidateProfileDTO } from 'src/app/interfaces/CandidateProfileDTO';
import { CandidateProfileUpdateDTO } from 'src/app/interfaces/CandidateProfileUpdateDTO';
import { Job } from 'src/app/interfaces/Job';
import { JobApplicationDTO } from 'src/app/interfaces/JobApplicationDTO';
import { PageResponse } from 'src/app/interfaces/PageResponse';
import { CandidateService } from 'src/app/services/candidate-service.service';
import { SavedJobService } from 'src/app/services/saved-job.service';
import { EmployerService } from 'src/app/services/employer-service.service';

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

  // SAVED-JOB DATA
   savedJobs: Job[] = [];
  private destroy$ = new Subject<void>();

  // View Resume
 displayFileDialog: boolean = false;
  dialogTitle: string = '';
  dialogFileUrl: SafeResourceUrl | null = null;
  fileType: 'pdf' | 'text' | 'word' | 'unsupported' = 'pdf';
  fileContent: string = '';

  constructor(
    private candidateService: CandidateService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private savedJobsService: SavedJobService,
    private confirmationService: ConfirmationService,
    private sanitizer: DomSanitizer,
    private employerService:EmployerService,
    private router:Router
  ) {
    this.profileUpdateForm = this.createProfileForm();
  }

  ngOnInit(): void {
    this.loadCandidateProfile();
    this.loadDashboardStats();
    this.loadJobApplications();
     this.loadSavedJobs();
    this.subscribeToSavedJobs();
  }

    ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

// SAVED-JOB MANAGEMENT
 /**
   * Load saved jobs from service
   */
  loadSavedJobs(): void {
    this.loading = true;
    this.savedJobsService.getSavedJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          console.log(this.savedJobs)
          this.savedJobs = jobs;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading saved jobs:', error);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load saved jobs'
          });
        }
      });
  }

  /**
   * Subscribe to saved jobs changes
   */
  private subscribeToSavedJobs(): void {
    this.savedJobsService.savedJobs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(jobs => {
        this.savedJobs = jobs;
      });
  }

  /**
   * Remove job from saved list
   */
  unsaveJob(jobId: string, event: Event): void {
    event.stopPropagation(); // Prevent navigation to job detail
    
    this.savedJobsService.unsaveJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Job removed from saved jobs'
          });
        },
        error: (error) => {
          console.error('Error unsaving job:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to remove job from saved jobs'
          });
        }
      });
  }

  /**
   * Navigate to job detail page
   */
  viewJobDetail(jobId: string): void {
    this.router.navigate(['/job-detail', jobId]);
  }

  /**
   * Get job type display class
   */
  getJobTypeClass(jobType: string): string {
    switch (jobType?.toLowerCase()) {
      case 'full_time':
      case 'full time':
        return 'FULL_TIME';
      case 'part_time':
      case 'part time':
        return 'PART_TIME';
      case 'contract':
        return 'CONTRACT';
      case 'internship':
        return 'INTERNSHIP';
      default:
        return 'job-type-default';
    }
  }

  /**
   * Get job type display text
   */
  getJobTypeText(jobType: string): string {
    switch (jobType?.toLowerCase()) {
      case 'full_time':
        return 'Full Time';
      case 'part_time':
        return 'Part Time';
      case 'contract':
        return 'Contract';
      case 'freelance':
        return 'Freelance';
      case 'internship':
        return 'Internship';
      default:
        return jobType;
    }
  }

  /**
   * Get experience level display class
   */
  getExperienceLevelClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'entry level':
      case 'entry':
        return 'exp-level-entry';
      case 'mid level':
      case 'mid':
        return 'exp-level-mid';
      case 'senior level':
      case 'senior':
        return 'exp-level-senior';
      case 'lead':
      case 'principal':
        return 'exp-level-lead';
      default:
        return 'exp-level-default';
    }
  }

  /**
   * Format posted date
   */
  getPostedTimeAgo(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      return 'Posted less than an hour ago';
    } else if (diffInHours < 24) {
      return `Posted ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays === 1) {
      return 'Posted 1 day ago';
    } else {
      return `Posted ${diffInDays} days ago`;
    }
  }

  /**
   * Truncate text with ellipsis
   */
  truncateText(text: string, maxLength: number = 150): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Refresh saved jobs
   */
  refreshSavedJobs(): void {
    this.loadSavedJobs();
  }

  // Navigation
  navigateToHome(){
    this.router.navigate(['/']);
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
   // Function to view resume
  viewResume(): void {
    if (this.candidateProfile && this.candidateProfile.resumeFileId) {
      this.employerService.downloadResume(this.candidateProfile.resumeFileId).subscribe({
        next: (blob: Blob) => {
          const fileName = this.candidateProfile?.resumeFileName || 'resume';
          this.openFileDialog('Resume', blob, fileName);
        },
        error: (error: any) => {
          console.error('Error loading resume:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load resume'
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Resume',
        detail: 'You have not uploaded a resume yet.'
      });
    }
  }

  // Opens the preview dialog
  openFileDialog(title: string, blob: Blob, fileName: string): void {
    this.dialogTitle = title;
    this.fileType = this.getFileType(fileName, blob.type);

    switch (this.fileType) {
      case 'pdf':
        const pdfUrl = window.URL.createObjectURL(blob);
        // Add #toolbar=0 to hide PDF toolbar
        this.dialogFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl + '#toolbar=0&navpanes=0&scrollbar=0');
        break;

      case 'text':
        this.readTextFile(blob);
        break;

      case 'word':
        this.handleWordFile(blob, fileName);
        break;

      case 'unsupported':
        this.messageService.add({
          severity: 'warn',
          summary: 'Unsupported Format',
          detail: 'This file format cannot be previewed. Please download to view.'
        });
        return;
    }

    this.displayFileDialog = true;
  }

  // Determines file type based on MIME type and file extension
  getFileType(fileName: string, mimeType: string): 'pdf' | 'text' | 'word' | 'unsupported' {
    const extension = fileName.toLowerCase().split('.').pop();
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    }
    if (mimeType === 'text/plain' || extension === 'txt') {
      return 'text';
    }
    if (
      mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
      mimeType.includes('application/msword') ||
      extension === 'docx' || extension === 'doc'
    ) {
      return 'word';
    }
    return 'unsupported';
  }

  // Reads text file content
  readTextFile(blob: Blob): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.fileContent = e.target?.result as string;
    };
    reader.readAsText(blob);
  }

  // Handles Word file preview; in this example we just show an info message
  handleWordFile(blob: Blob, fileName: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Word Document',
      detail: 'Word documents cannot be previewed directly. Please download to view the full content.'
    });
  }

  // Closes the file preview dialog
  closeFileDialog(): void {
    this.displayFileDialog = false;
    if (this.dialogFileUrl && typeof this.dialogFileUrl === 'string') {
      window.URL.revokeObjectURL(this.dialogFileUrl as string);
    }
    this.dialogFileUrl = null;
    this.fileContent = '';
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
