import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApplicationStatus } from '../interfaces/ApplicationStatus';
import { EmployerDashboardStats } from '../interfaces/EmployerDashboardStats';
import { EmployerProfile } from '../interfaces/EmployerProfile';
import { EmployerProfileUpdate } from '../interfaces/EmployerProfileUpdate';
import { Job } from '../interfaces/Job';
import { JobApplication } from '../interfaces/JobApplication';
import { JobStatus } from '../interfaces/JobStatus';

@Injectable({
  providedIn: 'root'
})
export class EmployerService {
private baseUrl = 'https://zclcl1fq-8080.inc1.devtunnels.ms/api/employer';

constructor(private http: HttpClient) {}

// Profile Management
  getMyProfile(): Observable<EmployerProfile> {
    return this.http.get<EmployerProfile>(`${this.baseUrl}/my-profile`);
  }

  updateProfile(profileData: EmployerProfileUpdate): Observable<EmployerProfile> {
    return this.http.put<EmployerProfile>(`${this.baseUrl}/profile-update`, profileData);
  }

  // Dashboard Statistics
  getDashboardStats(startDate?: string, endDate?: string): Observable<EmployerDashboardStats> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    return this.http.get<EmployerDashboardStats>(`${this.baseUrl}/dashboard`, { params });
  }

  // Job Management
  getMyJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.baseUrl}/my-jobs`);
  }

  // Application Management
  getApplicationsForJob(jobId: string): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.baseUrl}/applications/${jobId}`);
  }

 updateApplicationStatus(applicationId: number, status: ApplicationStatus): Observable<void> {
  const params = new HttpParams().set('status', status);
  return this.http.patch<void>(`${this.baseUrl}/application/${applicationId}/status`, {}, { params });
}

updateJobStatus(jobId:string, status:JobStatus):Observable<void>{
  const params = new HttpParams().set('status',status);
   return this.http.patch<void>(`${this.baseUrl}/jobId/${jobId}/status`, {}, { params });
}

  downloadResume(fileId: string): Observable<Blob> {
    return this.http.get(`https://zclcl1fq-8080.inc1.devtunnels.ms/api/files/${fileId}`, { responseType: 'blob' });
  }

  downloadCoverLetter(fileId: string): Observable<Blob> {
    return this.http.get(`https://zclcl1fq-8080.inc1.devtunnels.ms/api/files/${fileId}`, { responseType: 'blob' });
  }
}
