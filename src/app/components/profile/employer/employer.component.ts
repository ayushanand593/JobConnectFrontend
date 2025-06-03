import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApplicationStatus } from 'src/app/interfaces/ApplicationStatus';
import { EmployerDashboardStats } from 'src/app/interfaces/EmployerDashboardStats';
import { EmployerProfile } from 'src/app/interfaces/EmployerProfile';
import { Job } from 'src/app/interfaces/Job';
import { JobType } from 'src/app/interfaces/JobType';
import { ExperienceLevel } from 'src/app/interfaces/ExperienceLevel';
import { JobApplication } from 'src/app/interfaces/JobApplication';
import { JobStatus } from 'src/app/interfaces/JobStatus';
import { EmployerService } from 'src/app/services/employer-service.service';
import { DisclosureQuestion } from 'src/app/interfaces/DisclosureQuestion';
import { JobService } from 'src/app/services/job.service';
import { JobCreateDTO } from 'src/app/interfaces/JobCreateDTO';

@Component({
  selector: 'app-employer',
  templateUrl: './employer.component.html',
  styleUrls: ['./employer.component.scss']
})
export class EmployerComponent {
  // Tab management
  activeTab = 0;
  
  // Profile tab
  profile: EmployerProfile | null = null;
  profileForm: FormGroup;
  profileLoading = false;
  editing = false;
  ApplicationStatus = ApplicationStatus;

  // Dashboard tab
  dashboardStats: EmployerDashboardStats | null = null;
  dashboardLoading = false;
  dateRange: Date[] = [];

  // Jobs tab
  jobs: Job[] = [];
  jobsLoading = false;
  jobSearchValue = '';

  // Applications tab
  applications: JobApplication[] = [];
  filteredApplications: JobApplication[] = [];
  applicationsLoading = false;
  selectedJobId: string = '';
  appSearchValue = '';
  statusFilter: ApplicationStatus | null = null;

  // Create Job functionality
jobForm: FormGroup;
  jobTypes: any[] = JobType;
  experienceLevels: any[] =ExperienceLevel;
  availableSkills: string[] = [];
  isCreatingJob:boolean=false;
// filteredSkills: string[] = [];
selectedSkills: string[] = [];
skillInput: string = '';
skillInputControl = new FormControl('');
filteredSkills: string[] = [];
isLoadingSkills: boolean = false;
minDate: Date = new Date();

   // Disclosure Questions
  disclosureQuestions: DisclosureQuestion[] = [];

  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Submitted', value: ApplicationStatus.SUBMITTED },
    { label: 'Reviewed', value: ApplicationStatus.REVIEW },
    { label: 'Shortlisted', value: ApplicationStatus.SHORTLISTED },
    { label: 'Rejected', value: ApplicationStatus.REJECTED }
  ];
  // Add these properties to your component class
jobStatusOptions = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Draft', value: 'DRAFT' }
];

  constructor(
    private fb: FormBuilder,
    private employerService: EmployerService,
    private messageService: MessageService,
    private jobService:JobService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      jobTitle: ['', Validators.required]
    });

    this.jobForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    jobType: ['', Validators.required],
    experienceLevel: [''],
    description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(5000)]],
    requirements: ['', [Validators.maxLength(3000)]],
    responsibilities: ['', [Validators.maxLength(3000)]],
    salaryRange: ['', [Validators.maxLength(50)]],
    skills: [[]],
    applicationDeadline: [''],
    disclosureQuestions: this.fb.array([])
  });

    // Default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    this.dateRange = [startDate, endDate];
     this.initializeJobForm();
  }

ngOnInit() {
  this.route.queryParams.subscribe(params => {
    if (params['tab']) {
      this.activeTab = parseInt(params['tab'], 10);
    }
    if (params['jobId']) {
      this.selectedJobId = params['jobId'];
      this.activeTab = 3; 
    }

    // If they came in already with “tab=3&jobId=XYZ”, fetch that job’s applications:
    if (this.activeTab === 3 && this.selectedJobId) {
      this.loadApplications();
    }
  });
 if (!this.jobForm.get('skills')?.value) {
    this.jobForm.patchValue({ skills: [] });
  }
  
  // Sync selectedSkills with form control value on init and format them
  const existingSkills = this.jobForm.get('skills')?.value || [];
  this.selectedSkills = existingSkills.map((skill: string) => this.formatSkill(skill));
  
  // Update form control with formatted skills
  if (existingSkills.length > 0) {
    this.updateFormControl();
  }

  this.loadProfile();
  this.loadDashboardStats();
  this.loadJobs();
    this.loadInitialData();
}

  onTabChange(event: any) {
    this.activeTab = event.index;
    // Update URL query params
    // this.router.navigate([], {
    //   relativeTo: this.route,
    //   queryParams: { tab: this.activeTab },
    //   queryParamsHandling: 'merge'
    // });

    // Load applications if switching to applications tab and job is selected
    if (this.activeTab === 3 && this.selectedJobId) {
      this.loadApplications();
    }
  }

  // ===== PROFILE TAB METHODS =====
  loadProfile() {
    this.profileLoading = true;
    this.employerService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          jobTitle: profile.jobTitle
        });
        this.profileLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load profile'
        });
        this.profileLoading = false;
      }
    });
  }

  toggleEdit() {
    this.editing = !this.editing;
    if (!this.editing && this.profile) {
      // Reset form if canceling
      this.profileForm.patchValue({
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        phone: this.profile.phone,
        jobTitle: this.profile.jobTitle
      });
    }
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.profileLoading = true;
      this.employerService.updateProfile(this.profileForm.value).subscribe({
        next: (updatedProfile) => {
          this.profile = updatedProfile;
          this.editing = false;
          this.profileLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully'
          });
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update profile'
          });
          this.profileLoading = false;
        }
      });
    }
  }

  // ===== DASHBOARD TAB METHODS =====
  loadDashboardStats() {
    this.dashboardLoading = true;
    const startDate = this.dateRange[0]?.toISOString().split('T')[0];
    const endDate = this.dateRange[1]?.toISOString().split('T')[0];

    this.employerService.getDashboardStats(startDate, endDate).subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.dashboardLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load dashboard statistics'
        });
        this.dashboardLoading = false;
      }
    });
  }

  onDateRangeChange() {
    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      this.loadDashboardStats();
    }
  }

  // ===== JOBS TAB METHODS =====
  loadJobs() {
    this.jobsLoading = true;
    this.employerService.getMyJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.jobsLoading = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load jobs'
        });
        this.jobsLoading = false;
      }
    });
  }

  // FIXED: Proper tab switching and job selection
 viewApplications(jobId: string) {
  // 1) set the selected job
  this.selectedJobId = jobId;

  // 2) force the tab to switch immediately:
  this.activeTab = 3;

  // 3) load that job’s applications right away:
  this.loadApplications();

  // 4) then update the URL so that if I refresh or share the link,
  //    tab=3 and jobId=... will be in query params.
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { tab: 3, jobId: jobId },
    queryParamsHandling: 'merge'
  });
}

  editJob(jobId: string) {
    this.router.navigate(['/employer/jobs/edit', jobId]);
  }

  // ===== APPLICATIONS TAB METHODS =====
  loadApplications() {
    if (!this.selectedJobId) {
      console.log('No job selected');
      return;
    }
    
    console.log('Loading applications for job:', this.selectedJobId);
    this.applicationsLoading = true;
    
    this.employerService.getApplicationsForJob(this.selectedJobId).subscribe({
      next: (applications) => {
        console.log('Applications loaded:', applications);
        this.applications = applications;
        this.applyFilters();
        this.applicationsLoading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load applications'
        });
        this.applicationsLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredApplications = this.applications.filter(app => {
      const matchesSearch = !this.appSearchValue || 
        app.candidateName?.toLowerCase().includes(this.appSearchValue.toLowerCase()) ||
        app.candidateEmail?.toLowerCase().includes(this.appSearchValue.toLowerCase());
      
      const matchesStatus = !this.statusFilter || app.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    // console.log('Filtered applications:', this.filteredApplications);
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  updateApplicationStatus(application: JobApplication, newStatus: ApplicationStatus) {
    this.confirmationService.confirm({
      message: `Are you sure you want to ${newStatus.toLowerCase()} this application?`,
      header: 'Confirm Action',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.employerService.updateApplicationStatus(application.id, newStatus).subscribe({
          next: (updatedApplication) => {
            const index = this.applications.findIndex(app => app.id === application.id);
          if (index !== -1) {
            // Update the status locally
            this.applications[index] = {
              ...this.applications[index],
              status: newStatus,
              updatedAt: new Date() // Update timestamp
            };
            this.applyFilters();
           // Reapply filters to update the view
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Application status updated successfully'
          });
          
        },
          error: (error) => {
            console.error('Error updating application status:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update application status'
            });
          }
        });
      },
      reject: () => {
      // This ensures the dialog closes properly on "No" click
      // console.log('Action cancelled');
    }
    });
    
  }
  onStatusChange(jobId: string, newStatus: string, currentStatus: string): void {
  // If status hasn't actually changed, do nothing
  if (newStatus === currentStatus) {
    return;
  }

  const statusLabel = this.getStatusLabel(newStatus);
  
  this.confirmationService.confirm({
    message: `Are you sure you want to change the status of this job to ${statusLabel}?`,
    header: 'Confirm Status Change',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      this.updateJobStatus(jobId, newStatus);
    },
    reject: () => {
      // Reset dropdown to current status if user cancels
      // This is handled by not updating the model
    }
  });
}

// Add this method to update job status
updateJobStatus(jobId: string, newStatus: string): void {
  this.employerService.updateJobStatus(jobId, newStatus as JobStatus).subscribe({
    next: () => {
      // Update the local jobs array
      const jobIndex = this.jobs.findIndex(job => job.jobId === jobId);
      if (jobIndex !== -1) {
        this.jobs[jobIndex].status = newStatus as JobStatus;
      }
      
      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Job status updated successfully'
      });
    },
    error: (error) => {
      console.error('Error updating job status:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update job status'
      });
    }
  });
}

// Add this helper method to get status label
getStatusLabel(status: string): string {
  const option = this.statusOptions.find(opt => opt.value === status);
  return option ? option.label : status;
}
// Converts skills (Set, array, or comma-separated string) to a string array
getSkillsArray(skills: Set<string> | string[] | string | undefined): string[] {
  if (!skills) return [];

  if (skills instanceof Set) {
    return Array.from(skills);
  }

  if (Array.isArray(skills)) {
    return skills;
  }

  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

  return [];
}

// Checks if the skills input is non-empty
hasSkills(skills: Set<string> | string[] | string | undefined): boolean {
  if (!skills) return false;

  if (skills instanceof Set) {
    return skills.size > 0;
  }

  if (Array.isArray(skills)) {
    return skills.length > 0;
  }

  if (typeof skills === 'string') {
    return skills.trim().length > 0;
  }

  return false;
}
// Add this method to check if dropdown should be disabled
isStatusDropdownDisabled(status: string): boolean {
  return status === 'CLOSED';
}
  downloadResume(application: JobApplication) {
    if (application.resumeFileId) {
      this.employerService.downloadResume(application.resumeFileId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = application.resumeFileName || 'resume.pdf';
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading resume:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to download resume'
          });
        }
      });
    }
  }

  downloadCoverLetter(application: JobApplication) {
    if (application.coverLetterFileId) {
      this.employerService.downloadCoverLetter(application.coverLetterFileId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = application.coverLetterFileName || 'cover-letter.pdf';
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading cover letter:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to download cover letter'
          });
        }
      });
    }
  }

  // ===== CREATE JOB METHODS =====

   private initializeJobForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      jobType: ['', Validators.required],
      experienceLevel: [''],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(5000)]],
      requirements: ['', [Validators.maxLength(3000)]],
      responsibilities: ['', [Validators.maxLength(3000)]],
      salaryRange: ['', [Validators.maxLength(50)]],
      skills: [[]],
      applicationDeadline: [''],
      disclosureQuestions: this.fb.array([])
    });
  }

  private loadInitialData(): void {
    // Load job types and experience levels
    this.jobTypes = this.jobTypes;
    this.experienceLevels = this.experienceLevels;
    
    // Load available skills
    this.isLoadingSkills = true;
    this.jobService.getAvailableSkills().subscribe({
      next: (skills) => {
        this.availableSkills = skills;
        this.isLoadingSkills = false;
      },
      error: (error) => {
        console.error('Error loading skills:', error);
        this.isLoadingSkills = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Could not load available skills'
        });
      }
    });
  }

  // Disclosure Questions FormArray methods
  get disclosureQuestionsFormArray(): FormArray {
    return this.jobForm.get('disclosureQuestions') as FormArray;
  }

  addDisclosureQuestion(): void {
    const questionForm = this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      isRequired: [true]
    });
    
    this.disclosureQuestionsFormArray.push(questionForm);
  }

  removeDisclosureQuestion(index: number): void {
    if (this.disclosureQuestionsFormArray.length > 0) {
      this.disclosureQuestionsFormArray.removeAt(index);
    }
  }

  // Skills management
onSkillSelect(event: any): void {
  const pickedSkill = typeof event === 'string' ? event : event.value || event;
  
  if (pickedSkill && typeof pickedSkill === 'string') {
    const formattedSkill = this.formatSkill(pickedSkill);
    
    // Check for duplicates case-insensitively
    if (!this.selectedSkills.some(s => s.toLowerCase() === formattedSkill.toLowerCase())) {
      this.selectedSkills = [...this.selectedSkills, formattedSkill];
      this.updateFormControl();
    }
  }
  
  // Clear input after selection
  this.clearSkillInput();
}

removeSkill(skill: string): void {
  // Filter out the skill to be removed (using case-insensitive comparison)
  this.selectedSkills = this.selectedSkills.filter(s => s.toLowerCase() !== skill.toLowerCase());
  this.updateFormControl();
}

filterSkills(event: any): void {
  this.isLoadingSkills = true;
  const query = (event.query || '').toLowerCase().trim();
  
  // Simulate async filtering
  setTimeout(() => {
    if (query) {
      this.filteredSkills = this.availableSkills.filter(skill =>
        skill.toLowerCase().includes(query) &&
        !this.selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase())
      );
    } else {
      this.filteredSkills = [];
    }
    this.isLoadingSkills = false;
  }, 200);
}

handleEnterKey(event: any): void {
  event.preventDefault();
  event.stopPropagation();
  this.addCustomSkill();
}

addCustomSkill(): void {
  // Get the current input value from FormControl
  const customSkill = (this.skillInputControl.value || '').trim();
  if (customSkill) {
    const formattedSkill = this.formatSkill(customSkill);
    
    // Check for duplicates case-insensitively
    if (!this.selectedSkills.some(s => s.toLowerCase() === formattedSkill.toLowerCase())) {
      this.selectedSkills = [...this.selectedSkills, formattedSkill];
      this.updateFormControl();
    }
  }
  
  this.clearSkillInput();
}

onSkillInput(event: any): void {
  this.skillInput = event.target.value || '';
  // Also update the FormControl value
  this.skillInputControl.setValue(this.skillInput, { emitEvent: false });
}

// Helper methods
private formatSkill(skill: string): string {
  return skill.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

private updateFormControl(): void {
  this.jobForm.patchValue({ skills: [...this.selectedSkills] });
}

private clearSkillInput(): void {
  this.skillInput = '';
  this.skillInputControl.setValue('', { emitEvent: false });
}


  // Form submission
  onSubmitJob(): void {
    if (this.jobForm.valid) {
      this.isCreatingJob = true;
      
      const formValue = this.jobForm.value;
      
      // Prepare disclosure questions
      const disclosureQuestions: DisclosureQuestion[] = formValue.disclosureQuestions?.map((q: any) => ({
        id: 0, // Will be generated by backend
        questionText: q.questionText,
        questionType: 'TEXT' as const, // Default to TEXT type
        isRequired: q.isRequired,
        options: [] // Empty for TEXT type
      })) || [];

      const jobCreateDTO: JobCreateDTO = {
        title: formValue.title,
        location: formValue.location,
        jobType: formValue.jobType,
        experienceLevel: formValue.experienceLevel || undefined,
        description: formValue.description,
        requirements: formValue.requirements || undefined,
        responsibilities: formValue.responsibilities || undefined,
        salaryRange: formValue.salaryRange || undefined,
        skills: this.selectedSkills.length > 0 ? this.selectedSkills : undefined,
        applicationDeadline: formValue.applicationDeadline ? 
          new Date(formValue.applicationDeadline).toISOString().split('T')[0] : undefined,
        disclosureQuestions: disclosureQuestions.length > 0 ? disclosureQuestions : undefined
      };

      this.jobService.createJob(jobCreateDTO).subscribe({
        next: (createdJob) => {
          this.isCreatingJob = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Job created successfully!'
          });
          this.resetJobForm();
          // Optionally switch to a different tab or refresh job list
          this.activeTab = 2; // Switch to "My Jobs" tab
        },
        error: (error) => {
          this.isCreatingJob = false;
          console.error('Error creating job:', error);
          
          let errorMessage = 'Failed to create job. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            // Handle validation errors
            const validationErrors = Object.values(error.error.errors).join(', ');
            errorMessage = `Validation errors: ${validationErrors}`;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.jobForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Invalid',
        detail: 'Please fill in all required fields correctly.'
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  public resetJobForm(): void {
    this.jobForm.reset();
    this.selectedSkills = [];
    this.disclosureQuestionsFormArray.clear();
    this.initializeJobForm();
  }

  // ===== UTILITY METHODS =====
  getStatusSeverity(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'REVIEWED': return 'warning';
      case 'SHORTLISTED': return 'success';
      case 'REJECTED': return 'danger';
      case 'WITHDRAWN': return 'secondary';
      case 'OPEN': return 'success';
      case 'CLOSED': return 'danger';
      case 'DRAFT': return 'warning';
      default: return 'info';
    }
  }

  formatDate(value: string | Date): string {
    let dateObj: Date;
    if (typeof value === 'string') {
      dateObj = new Date(value);
    } else {
      dateObj = value;
    }
    return new Date(dateObj).toLocaleDateString();
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleDateString() + ' ' + 
           new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  // FIXED: Job selection logic
  getSelectedJobTitle(): string {
    const job = this.jobs.find(j => String(j.jobId) === String(this.selectedJobId));
    return job ? job.title : 'Select a Job';
  }
  isFieldInvalid(fieldName: string): boolean {
    const field = this.jobForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.jobForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Job Title',
      location: 'Location',
      jobType: 'Job Type',
      description: 'Description',
      requirements: 'Requirements',
      responsibilities: 'Responsibilities',
      salaryRange: 'Salary Range'
    };
    return labels[fieldName] || fieldName;
  }

  isDisclosureQuestionInvalid(index: number, fieldName: string): boolean {
    const questionForm = this.disclosureQuestionsFormArray.at(index) as FormGroup;
    const field = questionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

}
