import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JobSearchRequest } from 'src/app/interfaces/JobSearchRequest';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

   private titleSubject: Subject<string> = new Subject<string>();
  private locationSubject: Subject<string> = new Subject<string>();
  private companySubject: Subject<string> = new Subject<string>();
  private skillsSubject: Subject<string[]> = new Subject<string[]>();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 1) If the URL already has queryParams, prefill them and immediately emit.
    this.loadSearchFromUrl();

    // 2) Debounced “Job Title” changes
    this.titleSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((value: string) => {
        this.searchRequest.jobTitle = value || undefined;
        this.searchRequest.page = 0;
        this.updateUrlWithSearchParams();
        this.searchPerformed.emit({ ...this.searchRequest });
      });

    // 3) Debounced “Location” changes
    this.locationSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((value: string) => {
        this.searchRequest.location = value || undefined;
        this.searchRequest.page = 0;
        this.updateUrlWithSearchParams();
        this.searchPerformed.emit({ ...this.searchRequest });
      });

    // 4) Debounced “Company Name” changes
    this.companySubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((value: string) => {
        this.searchRequest.companyName = value || undefined;
        this.searchRequest.page = 0;
        this.updateUrlWithSearchParams();
        this.searchPerformed.emit({ ...this.searchRequest });
      });

    // 5) Debounced “Skills” array changes (compare via JSON.stringify)
    this.skillsSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => {
          return JSON.stringify(prev) === JSON.stringify(curr);
        })
      )
      .subscribe((skills: string[]) => {
        this.searchRequest.skills = skills.length > 0 ? [...skills] : undefined;
        this.searchRequest.page = 0;
        this.updateUrlWithSearchParams();
        this.searchPerformed.emit({ ...this.searchRequest });
      });
  }

  /**
   * If the user refreshes/bookmarks a URL containing queryParams (e.g. ?title=Senior&location=NYC),
   * read them here, populate `searchRequest`, and immediately emit so the parent loads filtered results.
   */
  loadSearchFromUrl(): void {
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        this.searchRequest = {
          companyName: params['company'] || undefined,
          jobTitle: params['title'] || undefined,
          location: params['location'] || undefined,
          jobType: params['jobType'] || undefined,
          experienceLevel: params['experience'] || undefined,
          page: parseInt(params['page'], 10) || 0,
          size: parseInt(params['size'], 10) || 10,
          sortBy: params['sortBy'] || 'createdAt',
          sortDirection: params['sortDirection'] || 'DESC'
        };

        if (params['skills']) {
          this.selectedSkills = Array.isArray(params['skills'])
            ? params['skills']
            : [params['skills']];
          this.searchRequest.skills = this.selectedSkills;
        }

        // If any advanced field is preset, open the panel
        if (
          params['company'] ||
          params['jobType'] ||
          params['experience'] ||
          params['skills']
        ) {
          this.showAdvancedSearch = true;
        }

        // Immediately emit to parent so that JobListComponent calls performSearch()
        this.searchPerformed.emit({ ...this.searchRequest });
      }
    });
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  /**
   * Add a skill and then push the updated array into skillsSubject for debounced search
   */
  addSkill(): void {
    if (this.skillInput.trim() && !this.selectedSkills.includes(this.skillInput.trim())) {
      this.selectedSkills.push(this.skillInput.trim());
      this.searchRequest.skills = [...this.selectedSkills];
      this.skillInput = '';

      // Immediately push the new skills-array into the subject
      this.skillsSubject.next([...this.selectedSkills]);
    }
  }

  /**
   * Remove a skill and then push the updated array into skillsSubject for debounced search
   */
  removeSkill(skill: string): void {
    this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
    this.searchRequest.skills = [...this.selectedSkills];

    // Emit the new (possibly empty) skill list
    this.skillsSubject.next([...this.selectedSkills]);
  }

  onSkillKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addSkill();
    }
  }

  /**
   * Manually trigger a search when the user clicks the “Search” button.
   * (Optional fallback, since most fields now auto-search as you type/select.)
   */
  performSearch(): void {
    this.searchRequest.page = 0;
    this.updateUrlWithSearchParams();
    this.searchPerformed.emit({ ...this.searchRequest });
  }

  /**
   * “Clear All” resets every field to default, removes queryParams from URL,
   * and emits an empty searchRequest so the parent can load all jobs again.
   */
  clearSearch(): void {
    this.searchRequest = {
      page: 0,
      size: 10,
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    };
    this.selectedSkills = [];
    this.skillInput = '';

    // Remove queryParams entirely
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });

    // Emit an “empty” search so that JobListComponent can switch to loadAllJobs()
    this.searchPerformed.emit({ ...this.searchRequest });
  }

  /**
   * Whenever any field changes, re-compose the URL’s queryParams to reflect the current state.
   */
  private updateUrlWithSearchParams(): void {
    const queryParams: any = {};

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

  //
  // ─── “ON CHANGE” HANDLERS FOR EACH FIELD ────────────────────────────────
  //

  /** Called on every keystroke in the “Job Title” field */
  onTitleInput(value: string): void {
    this.titleSubject.next(value.trim());
  }

  /** Called on every keystroke in the “Location” field */
  onLocationInput(value: string): void {
    this.locationSubject.next(value.trim());
  }

  /** Called on every keystroke in the “Company Name” field */
  onCompanyInput(value: string): void {
    this.companySubject.next(value.trim());
  }

  /** Called immediately when user changes the “Job Type” dropdown */
  onJobTypeChange(value: string | null): void {
    this.searchRequest.jobType = value || undefined;
    this.searchRequest.page = 0;
    this.updateUrlWithSearchParams();
    this.searchPerformed.emit({ ...this.searchRequest });
  }

  /** Called immediately when user changes the “Experience Level” dropdown */
  onExperienceChange(value: string | null): void {
    this.searchRequest.experienceLevel = value || undefined;
    this.searchRequest.page = 0;
    this.updateUrlWithSearchParams();
    this.searchPerformed.emit({ ...this.searchRequest });
  }
}
