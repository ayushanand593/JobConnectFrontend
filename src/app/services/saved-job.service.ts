import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { Job } from '../interfaces/Job';
import { SavedJobDTO } from '../interfaces/SavedJobDTO';
import { AuthService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class SavedJobService {

  private readonly API_URL = 'http://localhost:8080/api/saved-jobs';
  private savedJobsSubject = new BehaviorSubject<Job[]>([]);
  public savedJobs$ = this.savedJobsSubject.asObservable();
  
  private savedJobIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  public savedJobIds$ = this.savedJobIdsSubject.asObservable();

 constructor(
    private http: HttpClient,
    private authService: AuthService  // Add AuthService
  ) {
    // Only load saved jobs if user is a candidate
    if (this.authService.hasRole('CANDIDATE')) {
      this.loadSavedJobs();
    }
  }
  private isCandidate(): boolean {
    return this.authService.hasRole('CANDIDATE');
  }
 saveJob(jobId: string): Observable<SavedJobDTO> {
    if (!this.isCandidate()) {
      return new Observable(); // Return empty observable for non-candidates
    }
    return this.http.post<SavedJobDTO>(`${this.API_URL}/${jobId}`, {}).pipe(
      tap(() => {
        const currentIds = this.savedJobIdsSubject.value;
        currentIds.add(jobId);
        this.savedJobIdsSubject.next(new Set(currentIds));
        this.loadSavedJobs();
      })
    );
  }

  unsaveJob(jobId: string): Observable<string> {
    if (!this.isCandidate()) {
      return new Observable(); // Return empty observable for non-candidates
    }
    return this.http.delete<string>(`${this.API_URL}/${jobId}`, {
      responseType: 'text' as 'json'
    }).pipe(
      tap(() => {
        const currentIds = this.savedJobIdsSubject.value;
        currentIds.delete(jobId);
        this.savedJobIdsSubject.next(new Set(currentIds));
        
        const currentJobs = this.savedJobsSubject.value;
        const updatedJobs = currentJobs.filter(job => job.jobId !== jobId);
        this.savedJobsSubject.next(updatedJobs);
      })
    );
  }

  getSavedJobs(): Observable<Job[]> {
    if (!this.isCandidate()) {
      return new Observable(); // Return empty observable for non-candidates
    }
    return this.http.get<Job[]>(this.API_URL).pipe(
      tap(jobs => {
        this.savedJobsSubject.next(jobs);
        const jobIds = new Set(jobs.map(job => job.jobId));
        this.savedJobIdsSubject.next(jobIds);
      })
    );
  }

  isJobSaved(jobId: string): Observable<boolean> {
    if (!this.isCandidate()) {
      return of(false); // Return observable of false for non-candidates
    }
    return this.http.get<boolean>(`${this.API_URL}/${jobId}/is-saved`);
  }

  private loadSavedJobs(): void {
    if (!this.isCandidate()) {
      return; // Don't load for non-candidates
    }
    this.getSavedJobs().subscribe({
      next: (jobs) => {
        // Already handled in tap operator
      },
      error: (error) => {
        console.error('Error loading saved jobs:', error);
      }
    });
  }

  isJobSavedSync(jobId: string): boolean {
    if (!this.isCandidate()) {
      return false; // Return false for non-candidates
    }
    return this.savedJobIdsSubject.value.has(jobId);
  }

  refreshSavedJobs(): void {
    if (!this.isCandidate()) {
      return; // Don't refresh for non-candidates
    }
    this.loadSavedJobs();
  }
}
