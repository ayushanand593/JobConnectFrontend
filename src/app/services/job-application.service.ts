import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobApplication } from '../interfaces/JobApplication';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class JobApplicationService {
  private apiUrl = 'https://zclcl1fq-8080.inc1.devtunnels.ms/api/applications';

  constructor(private http: HttpClient) {}

   /**
   * Get a specific job application by ID (for employers)
   */
  getJobApplication(applicationId: number): Observable<JobApplication> {
    return this.http.get<JobApplication>(`${this.apiUrl}/${applicationId}`);
  }

  /**
   * View/Download resume file
   */
  viewResumeFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/view`, {
      responseType: 'blob'
    });
  }

  /**
   * Download resume file
   */
  downloadResumeFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * View/Download cover letter file
   */
  viewCoverLetterFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/view`, {
      responseType: 'blob'
    });
  }

  /**
   * Download cover letter file
   */
  downloadCoverLetterFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/download`, {
      responseType: 'blob'
    });
  }
}
