import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JobSearchRequest } from 'src/app/interfaces/JobSearchRequest';

@Component({
  selector: 'app-job-search',
  templateUrl: './job-search.component.html',
  styleUrls: ['./job-search.component.scss']
})
export class JobSearchComponent implements OnInit {
  @Output() searchPerformed = new EventEmitter<JobSearchRequest>();

  // Search form fields
  searchRequest: JobSearchRequest = {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'DESC'
  };

  // UI state
  showAdvancedSearch = false;
  skillInput = '';
  selectedSkills: string[] = [];

  // Dropdown options
  jobTypeOptions = [
    { label: 'All Types', value: null },
    { label: 'Full Time', value: 'FULL_TIME' },
    { label: 'Part Time', value: 'PART_TIME' },
    { label: 'Contract', value: 'CONTRACT' },
    { label: 'Freelance', value: 'FREELANCE' },
    { label: 'Internship', value: 'INTERNSHIP' }
  ];

  experienceLevelOptions = [
    { label: 'All Levels', value: null },
    { label: 'Entry Level', value: 'ENTRY_LEVEL' },
    { label: 'Junior (1-2 Years)', value: 'JUNIOR' },
    { label: 'Mid-level (3-5 Years)', value: 'MID_LEVEL' },
    { label: 'Senior (5+ Years)', value: 'SENIOR' },
    { label: 'Lead/Manager', value: 'LEAD' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Load search parameters from URL if available
    this.loadSearchFromUrl();
  }

  loadSearchFromUrl(): void {
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        this.searchRequest = {
          companyName: params['company'] || undefined,
          jobTitle: params['title'] || undefined,
          location: params['location'] || undefined,
          jobType: params['jobType'] || undefined,
          experienceLevel: params['experience'] || undefined,
          page: parseInt(params['page']) || 0,
          size: parseInt(params['size']) || 10,
          sortBy: params['sortBy'] || 'createdAt',
          sortDirection: params['sortDirection'] || 'DESC'
        };

        if (params['skills']) {
          this.selectedSkills = Array.isArray(params['skills']) 
            ? params['skills'] 
            : [params['skills']];
          this.searchRequest.skills = this.selectedSkills;
        }

        // Show advanced search if advanced parameters are present
        if (params['company'] || params['jobType'] || params['experience'] || params['skills']) {
          this.showAdvancedSearch = true;
        }

        // Emit search to parent component
        this.performSearch();
      }
    });
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  addSkill(): void {
    if (this.skillInput.trim() && !this.selectedSkills.includes(this.skillInput.trim())) {
      this.selectedSkills.push(this.skillInput.trim());
      this.searchRequest.skills = [...this.selectedSkills];
      this.skillInput = '';
    }
  }

  removeSkill(skill: string): void {
    this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
    this.searchRequest.skills = [...this.selectedSkills];
  }

  onSkillKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addSkill();
    }
  }

  performSearch(): void {
    // Reset pagination when performing new search
    this.searchRequest.page = 0;
    
    // Update URL with search parameters
    this.updateUrlWithSearchParams();
    
    // Emit search request to parent component
    this.searchPerformed.emit({ ...this.searchRequest });
  }

  clearSearch(): void {
    this.searchRequest = {
      page: 0,
      size: 10,
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    };
    this.selectedSkills = [];
    this.skillInput = '';
    
    // Clear URL parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
    
    // Emit empty search to show all jobs
    this.searchPerformed.emit({ ...this.searchRequest });
  }

  private updateUrlWithSearchParams(): void {
    const queryParams: any = {};
    
    // Only add non-empty parameters to URL
    if (this.searchRequest.jobTitle) {
      queryParams.title = this.searchRequest.jobTitle;
    }
    if (this.searchRequest.location) {
      queryParams.location = this.searchRequest.location;
    }
    if (this.searchRequest.companyName) {
      queryParams.company = this.searchRequest.companyName;
    }
    if (this.searchRequest.jobType) {
      queryParams.jobType = this.searchRequest.jobType;
    }
    if (this.searchRequest.experienceLevel) {
      queryParams.experience = this.searchRequest.experienceLevel;
    }
    if (this.selectedSkills.length > 0) {
      queryParams.skills = this.selectedSkills;
    }
    if (this.searchRequest.page && this.searchRequest.page > 0) {
      queryParams.page = this.searchRequest.page;
    }
    if (this.searchRequest.size && this.searchRequest.size !== 10) {
      queryParams.size = this.searchRequest.size;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams
    });
  }
}
