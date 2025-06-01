import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CandidateDashboardStatsDTO } from '../interfaces/CandidateDashboardStatsDTO';
import { CandidateProfileDTO } from '../interfaces/CandidateProfileDTO';
import { CandidateProfileUpdateDTO } from '../interfaces/CandidateProfileUpdateDTO';
import { JobApplicationDTO } from '../interfaces/JobApplicationDTO';
import { PageResponse } from '../interfaces/PageResponse';

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private baseUrl = 'http://localhost:8080/api/candidate'; // Adjust based on your API base URL

  constructor(private http: HttpClient) {}

  // Get candidate profile
  getCandidateProfile(): Observable<CandidateProfileDTO> {
    return this.http.get<CandidateProfileDTO>(`${this.baseUrl}/profile`);
  }

  // Update candidate profile
  updateCandidateProfile(profileData: CandidateProfileUpdateDTO): Observable<CandidateProfileDTO> {
    return this.http.put<CandidateProfileDTO>(`${this.baseUrl}/profile-update`, profileData);
  }

  // Upload resume
  uploadResume(file: File): Observable<CandidateProfileDTO> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<CandidateProfileDTO>(`${this.baseUrl}/resume`, formData);
  }

  // Get dashboard statistics
  getDashboardStats(startDate?: Date, endDate?: Date): Observable<CandidateDashboardStatsDTO> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    
    return this.http.get<CandidateDashboardStatsDTO>(`${this.baseUrl}/dashboard`, { params });
  }

  // Get candidate applications with pagination
  getMyApplications(page: number = 0, size: number = 10): Observable<PageResponse<JobApplicationDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<PageResponse<JobApplicationDTO>>(`${this.baseUrl}/my-applications`, { params });
  }
}
