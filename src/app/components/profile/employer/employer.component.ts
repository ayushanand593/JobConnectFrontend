import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApplicationStatus } from 'src/app/interfaces/ApplicationStatus';
import { EmployerDashboardStats } from 'src/app/interfaces/EmployerDashboardStats';
import { EmployerProfile } from 'src/app/interfaces/EmployerProfile';
import { Job } from 'src/app/interfaces/Job';
import { JobApplication } from 'src/app/interfaces/JobApplication';
import { EmployerService } from 'src/app/services/employer-service.service';

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

  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Submitted', value: ApplicationStatus.SUBMITTED },
    { label: 'Reviewed', value: ApplicationStatus.REVIEW },
    { label: 'Shortlisted', value: ApplicationStatus.SHORTLISTED },
    { label: 'Rejected', value: ApplicationStatus.REJECTED }
  ];

  constructor(
    private fb: FormBuilder,
    private employerService: EmployerService,
    private messageService: MessageService,
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

    // Default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    this.dateRange = [startDate, endDate];
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

  this.loadProfile();
  this.loadDashboardStats();
  this.loadJobs();
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
    console.log('Filtered applications:', this.filteredApplications);
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
      console.log('Action cancelled');
    }
    });
    
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
}
