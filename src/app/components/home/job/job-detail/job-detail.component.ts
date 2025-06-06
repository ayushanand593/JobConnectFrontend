import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Job } from 'src/app/interfaces/Job';
import { AuthService } from 'src/app/services/auth-service.service';
import { JobService } from 'src/app/services/job.service';
import { SavedJobService } from 'src/app/services/saved-job.service';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss']
})

export class JobDetailComponent implements OnInit {
  job: Job | null = null;
  loading = true;
  error = false;
  jobId: string = '';
  role:boolean=false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
     private savedJobService: SavedJobService,
     private authService:AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.jobId = params['jobId'];
      if (this.jobId) {
        this.loadJobDetails();
      }
    });
     this.savedJobService.refreshSavedJobs();
     this.role=this.authService.hasRole("CANDIDATE");
  }

  loadJobDetails(): void {
    this.loading = true;
    this.error = false;
    
    this.jobService.getJobByJobId(this.jobId).subscribe({
      next: (job: Job) => {
        this.job = job;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading job details:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  getCompanyInitials(companyName: string): string {
    return companyName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  formatSalary(salaryRange: string): string {
    if (!salaryRange) return 'Not specified';
    
    // Handle range format like "6000-9000"
    if (salaryRange.includes('-')) {
      const [min, max] = salaryRange.split('-');
      return `$${this.formatNumber(parseInt(min))} - $${this.formatNumber(parseInt(max))}`;
    }
    
    // Handle single value like "1200000"
    return `$${this.formatNumber(parseInt(salaryRange))}`;
  }

  private formatNumber(num: number): string {
    return num.toLocaleString();
  }

  formatJobType(jobType: string): string {
    return jobType.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatExperienceLevel(level: string | null): string {
    if (!level) return '';
    return level.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getDaysAgo(dateString: string): string {
    const jobDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - jobDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Posted 1 day ago';
    return `Posted ${diffDays} days ago`;
  }

  onApplyNow(): void {
  if (this.job) {
    console.log('Applying to job:', this.job.jobId);
    
    // Navigate to job application page with jobId
    this.router.navigate(['/jobs', this.job.jobId, 'apply']);
  } else {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Job information not available'
    });
  }
}

// Save Job Functionalities
 /**
   * Check if current job is saved
   */
  isJobSaved(): boolean {
    return this.job ? this.savedJobService.isJobSavedSync(this.job.jobId) : false;
  }

  /**
   * Toggle save/unsave current job
   */
  toggleSaveJob(): void {
    if (!this.job) return;
    
    if (this.isJobSaved()) {
      this.unsaveJob();
    } else {
      this.saveJob();
    }
  }

  /**
   * Save current job
   */
  saveJob(): void {
    if (!this.job) return;
    
    this.savedJobService.saveJob(this.job.jobId).subscribe({
      next: (response) => {
        console.log('Job saved successfully:', response);
        // Optionally show a toast notification
      },
      error: (error) => {
        console.error('Error saving job:', error);
        // Handle error - show toast notification
      }
    });
  }

  /**
   * Unsave current job
   */
  unsaveJob(): void {
    if (!this.job) return;
    
    this.savedJobService.unsaveJob(this.job.jobId).subscribe({
      next: (response) => {
        console.log('Job unsaved successfully:', response);
        // Optionally show a toast notification
      },
      error: (error) => {
        console.error('Error unsaving job:', error);
        // Handle error - show toast notification
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
  

}
