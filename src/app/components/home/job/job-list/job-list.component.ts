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
        console.log(response)

        this.jobs = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
      },
      error: (error:any) => {
        console.log(error)
        console.error('Error loading jobs:', error);
        this.loading = false;
      }
    });
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
    this.router.navigate(['/apply', job.jobId]);
  }
}
