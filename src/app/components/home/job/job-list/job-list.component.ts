import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Job } from 'src/app/interfaces/Job';
import { PageResponse } from 'src/app/interfaces/PageResponse';
import { JobService } from 'src/app/services/job.service';


@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit {
  jobs: Job[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  first: number = 0;
  rows: number = 10;
  
  // Sort options
  sortOptions = [
    { label: 'Most Relevant', value: 'relevant' },
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Salary High to Low', value: 'salary_desc' },
    { label: 'Salary Low to High', value: 'salary_asc' }
  ];
  
  selectedSort = 'relevant';

  defaultLogoUrl = 'assets/images/default-company-logo.png';

  constructor(private jobService: JobService, private router:Router) {}

  ngOnInit(): void {
    this.loadJobs();
  }

   loadJobs(event?: any): void {
  this.loading = true;
  
  const page = event ? event.first / event.rows : 0;
  const size = event ? event.rows : this.rows;

  this.jobService.getAllJobs(page, size).subscribe({
    next: (response: PageResponse<Job>) => {
      console.log('Jobs response:', response);
      
      // Process jobs and log logo information
      this.jobs = response.content.map(job => {
        const processedJob = {
          ...job,
          logoDataUrl: this.getCompanyLogoUrl(job)
        };
        
        // Debug logging for each job
        if (job.logoBase64 && job.logoContentType) {
          console.log(`Job ${job.title} - Company ${job.companyName}: Has logo (${job.logoContentType}, ${job.logoBase64.length} chars)`);
        } else {
          console.log(`Job ${job.title} - Company ${job.companyName}: No logo data`);
        }
        
        return processedJob;
      });
      
      this.totalRecords = response.totalElements;
      this.loading = false;
    },
    error: (error: any) => {
      console.error('Error loading jobs:', error);
      this.loading = false;
    }
  });
}

    getCompanyLogoUrl(job: Job): string {
      if (job.logoBase64 && job.logoContentType) {
        return `data:${job.logoContentType};base64,${job.logoBase64}`;
      }
      return this.defaultLogoUrl;
    }

    // Method to check if job has a custom logo
    hasCustomLogo(job: Job): boolean {
      return !!(job.logoBase64 && job.logoContentType);
    }

    // Method to get company initials for fallback
    getCompanyInitials(companyName: string): string {
      return companyName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadJobs(event);
  }

  onSortChange(): void {
    // Implement sorting logic here
    // You might need to modify your backend API to support sorting
    this.loadJobs();
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      return diffInHours > 0 ? `${diffInHours} hours ago` : 'Just now';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else {
      return `${diffInDays} days ago`;
    }
  }

  formatJobType(jobType: string): string {
    return jobType.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatExperienceLevel(level: string): string {
    return level.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  navigateTo(job:Job){
    this.router.navigate(['/job-detail', job.jobId]);
  }
    onLogoError(event: any, job: Job): void {
    console.warn(`Failed to load logo for ${job.companyName}:`, event);
    // Hide the broken image and show fallback
    event.target.style.display = 'none';
    // You could also update the job object to mark the logo as invalid
    job.logoDataUrl = undefined;
  }

  // // Optional: Add a method to retry logo loading
  // retryLogoLoad(job: Job): void {
  //   if (job.logoFileId) {
  //     // You could implement a separate endpoint to refresh logo data
  //     this.jobService.refreshJobLogo(job.jobId).subscribe({
  //       next: (updatedJob) => {
  //         const index = this.jobs.findIndex(j => j.jobId === job.jobId);
  //         if (index !== -1) {
  //           this.jobs[index] = { ...this.jobs[index], ...updatedJob };
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Failed to refresh logo:', error);
  //       }
  //     });
  //   }
  // }

}
