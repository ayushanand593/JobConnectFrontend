import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Job } from '../interfaces/Job';
import { SavedJobDTO } from '../interfaces/SavedJobDTO';

@Injectable({
  providedIn: 'root'
})
export class SavedJobService {

  private readonly API_URL = 'http://localhost:8080/api/saved-jobs';
  private savedJobsSubject = new BehaviorSubject<Job[]>([]);
  public savedJobs$ = this.savedJobsSubject.asObservable();
  
  private savedJobIdsSubject = new BehaviorSubject<Set<string>>(new Set());
  public savedJobIds$ = this.savedJobIdsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSavedJobs();
  }

  /**
   * Save a job by jobId
   */
  saveJob(jobId: string): Observable<SavedJobDTO> {
    return this.http.post<SavedJobDTO>(`${this.API_URL}/${jobId}`, {}).pipe(
      tap(() => {
        // Update the saved job IDs set
        const currentIds = this.savedJobIdsSubject.value;
        currentIds.add(jobId);
        this.savedJobIdsSubject.next(new Set(currentIds));
        
        // Refresh saved jobs list
        this.loadSavedJobs();
      })
    );
  }

  /**
   * Unsave a job by jobId
   */
  unsaveJob(jobId: string): Observable<string> {
    return this.http.delete<string>(`${this.API_URL}/${jobId}`, {
      responseType: 'text' as 'json'
    }).pipe(
      tap(() => {
        // Update the saved job IDs set
        const currentIds = this.savedJobIdsSubject.value;
        currentIds.delete(jobId);
        this.savedJobIdsSubject.next(new Set(currentIds));
        
        // Update saved jobs list
        const currentJobs = this.savedJobsSubject.value;
        const updatedJobs = currentJobs.filter(job => job.jobId !== jobId);
        this.savedJobsSubject.next(updatedJobs);
      })
    );
  }

  /**
   * Get all saved jobs for current candidate
   */
  getSavedJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.API_URL).pipe(
      tap(jobs => {
        this.savedJobsSubject.next(jobs);
        // Update saved job IDs set
        const jobIds = new Set(jobs.map(job => job.jobId));
        this.savedJobIdsSubject.next(jobIds);
      })
    );
  }

  /**
   * Check if a job is saved
   */
  isJobSaved(jobId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/${jobId}/is-saved`);
  }

  /**
   * Load saved jobs and update subjects
   */
  private loadSavedJobs(): void {
    this.getSavedJobs().subscribe({
      next: (jobs) => {
        // Already handled in tap operator
      },
      error: (error) => {
        console.error('Error loading saved jobs:', error);
      }
    });
  }

  /**
   * Check if a job is saved (synchronous check using cached data)
   */
  isJobSavedSync(jobId: string): boolean {
    return this.savedJobIdsSubject.value.has(jobId);
  }

  /**
   * Get current saved jobs count
   */
  getSavedJobsCount(): number {
    return this.savedJobsSubject.value.length;
  }

  /**
   * Refresh saved jobs data
   */
  refreshSavedJobs(): void {
    this.loadSavedJobs();
  }
}
