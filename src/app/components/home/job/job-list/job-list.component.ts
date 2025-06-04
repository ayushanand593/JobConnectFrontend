import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Job } from 'src/app/interfaces/Job';
import { JobSearchRequest } from 'src/app/interfaces/JobSearchRequest';
import { PageResponse } from 'src/app/interfaces/PageResponse';
import { JobService } from 'src/app/services/job.service';
import { SavedJobService } from 'src/app/services/saved-job.service';


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
  
  // Search state
  isSearchMode: boolean = false;
  currentSearchRequest: JobSearchRequest = {};
  
  // Sort options
  sortOptions = [
    { label: 'Most Relevant', value: 'relevant' },
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Company A-Z', value: 'company_asc' },
    { label: 'Company Z-A', value: 'company_desc' }
  ];
  selectedSort = 'newest';

  defaultLogoUrl = 'assets/images/default-company-logo.png';

  

  constructor(
    private jobSearchService: JobService, 
     private savedJobService: SavedJobService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if there are search parameters in URL
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        this.isSearchMode = true;
        // Search will be triggered by the search component, so we just mark search mode
      } else {
        this.isSearchMode = false;
        this.loadAllJobs();
      }
    });
    this.savedJobService.refreshSavedJobs();
  }

  // Handle search performed from the JobSearchComponent
  onSearchPerformed(searchRequest: JobSearchRequest): void {
    this.currentSearchRequest = { ...searchRequest };
    this.isSearchMode = true;
    this.first = 0; // Reset pagination
    this.performSearch();
  }

  // Load all jobs (default view)
  loadAllJobs(event?: any): void {
    this.loading = true;
    
    const page = event ? event.first / event.rows : 0;
    const size = event ? event.rows : this.rows;

    this.jobSearchService.getAllJobs(page, size).subscribe({
      next: (response: PageResponse<Job>) => {
        this.processJobsResponse(response);
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.loading = false;
      }
    });
  }

  // Perform search with currentSearchRequest
  performSearch(event?: any): void {
    this.loading = true;
    
    // Update pagination if triggered by paginator
    if (event) {
      this.currentSearchRequest.page = event.first / event.rows;
      this.currentSearchRequest.size = event.rows;
    } else {
      this.currentSearchRequest.page = 0;
      this.currentSearchRequest.size = this.rows;
    }

    // Update sort parameters
    this.updateSortParameters();

    this.jobSearchService.searchJobs(this.currentSearchRequest).subscribe({
      next: (response: PageResponse<Job>) => {
        this.processJobsResponse(response);
      },
      error: (error: any) => {
        console.error('Error searching jobs:', error);
        this.loading = false;
      }
    });
  }

  // Process the response from getAllJobs or searchJobs
  private processJobsResponse(response: PageResponse<Job>): void {
    console.log('Jobs response:', response);
    
    // Map each job to include a valid logo URL (or fallback)
    this.jobs = response.content.map(job => {
      const processedJob = {
        ...job,
        logoDataUrl: this.getCompanyLogoUrl(job)
      };
      
      if (job.logoBase64 && job.logoContentType) {
        console.log(`Job ${job.title} - Company ${job.companyName}: Has logo (${job.logoContentType})`);
      } else {
        console.log(`Job ${job.title} - Company ${job.companyName}: No logo data, using default`);
      }
      
      return processedJob;
    });
    
    this.totalRecords = response.totalElements;
    this.loading = false;
  }

  // Figure out the correct URL (data:base64 or fallback asset) for each company logo
  getCompanyLogoUrl(job: Job): string {
    if (job.logoBase64 && job.logoContentType) {
      return `data:${job.logoContentType};base64,${job.logoBase64}`;
    }
    return this.defaultLogoUrl;
  }

  hasCustomLogo(job: Job): boolean {
    return !!(job.logoBase64 && job.logoContentType);
  }

  // Create “AB” from “Acme Business”
  getCompanyInitials(companyName: string): string {
    return companyName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  // Called when paginator is used
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    
    if (this.isSearchMode) {
      this.performSearch(event);
    } else {
      this.loadAllJobs(event);
    }
  }

  // Called when sort dropdown changes
  onSortChange(): void {
    this.first = 0; // Reset to page 1 when sorting
    
    if (this.isSearchMode) {
      this.performSearch();
    } else {
      // Switch to “search mode” even if criteria is empty, to handle sorting on backend
      this.currentSearchRequest = { page: 0, size: this.rows };
      this.isSearchMode = true;
      this.performSearch();
    }
  }

  // Saved Job Functionalities
   /**
   * Check if a job is saved
   */
  isJobSaved(jobId: string): boolean {
    return this.savedJobService.isJobSavedSync(jobId);
  }

  /**
   * Toggle save/unsave job
   */
  toggleSaveJob(jobId: string, event: Event): void {
    event.stopPropagation(); // Prevent navigation to job details
    
    if (this.isJobSaved(jobId)) {
      this.unsaveJob(jobId, event);
    } else {
      this.saveJob(jobId, event);
    }
  }

  /**
   * Save a job
   */
  saveJob(jobId: string, event: Event): void {
    event.stopPropagation();
    
    this.savedJobService.saveJob(jobId).subscribe({
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
   * Unsave a job
   */
  unsaveJob(jobId: string, event: Event): void {
    event.stopPropagation();
    
    this.savedJobService.unsaveJob(jobId).subscribe({
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

  // Map selectedSort → sortBy & sortDirection on currentSearchRequest
  private updateSortParameters(): void {
    switch (this.selectedSort) {
      case 'newest':
        this.currentSearchRequest.sortBy = 'createdAt';
        this.currentSearchRequest.sortDirection = 'DESC';
        break;
      case 'oldest':
        this.currentSearchRequest.sortBy = 'createdAt';
        this.currentSearchRequest.sortDirection = 'ASC';
        break;
      case 'company_asc':
        this.currentSearchRequest.sortBy = 'companyName';
        this.currentSearchRequest.sortDirection = 'ASC';
        break;
      case 'company_desc':
        this.currentSearchRequest.sortBy = 'companyName';
        this.currentSearchRequest.sortDirection = 'DESC';
        break;
      default:
        this.currentSearchRequest.sortBy = 'createdAt';
        this.currentSearchRequest.sortDirection = 'DESC';
    }
  }

  // Clear search and return to all-jobs view
  clearSearch(): void {
    this.isSearchMode = false;
    this.currentSearchRequest = {};
    this.first = 0; // reset paginator to first page

    // Clear URL parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });

    // Load all jobs again since we're no longer in search mode
    this.loadAllJobs();
  }

  // (Optional helper) Show a small “search summary” string in your template
  getSearchSummary(): string {
    if (!this.isSearchMode) return '';
    
    const parts = [];
    if (this.currentSearchRequest.jobTitle) {
      parts.push(`Title: "${this.currentSearchRequest.jobTitle}"`);
    }
    if (this.currentSearchRequest.location) {
      parts.push(`Location: "${this.currentSearchRequest.location}"`);
    }
    if (this.currentSearchRequest.companyName) {
      parts.push(`Company: "${this.currentSearchRequest.companyName}"`);
    }
    if (this.currentSearchRequest.skills && this.currentSearchRequest.skills.length > 0) {
      parts.push(`Skills: ${this.currentSearchRequest.skills.join(', ')}`);
    }
    
    return parts.length > 0 ? `Searching for: ${parts.join(' | ')}` : 'Advanced search applied';
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
