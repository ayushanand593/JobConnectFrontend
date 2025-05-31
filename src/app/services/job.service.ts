import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '../interfaces/PageResponse';
import { Job } from '../interfaces/Job';
import { JobSearchRequest } from '../interfaces/JobSearchRequest';

@Injectable({
  providedIn: 'root'
})
export class JobService {
private apiUrl = 'http://localhost:8080/api/jobs'; // Adjust base URL as needed

  constructor(private http: HttpClient) {}

  getAllJobs(page: number = 0, size: number = 10): Observable<PageResponse<Job>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<Job>>(`${this.apiUrl}/jobs`, { params });
  }

  getJobByJobId(jobId:String):Observable<Job>{
    return this.http.get<Job>(`${this.apiUrl}/jobId/${jobId}`);
  }
  searchJobs(searchRequest: JobSearchRequest): Observable<PageResponse<Job>> {
    return this.http.post<PageResponse<Job>>(`${this.apiUrl}/search`, searchRequest);
  }

  // Search jobs using GET method (for simple search with query parameters)
  // searchJobsGet(searchRequest: JobSearchRequest): Observable<PageResponse<Job>> {
  //   let params = new HttpParams();
    
  //   if (searchRequest.companyName) {
  //     params = params.set('companyName', searchRequest.companyName);
  //   }
  //   if (searchRequest.jobTitle) {
  //     params = params.set('jobTitle', searchRequest.jobTitle);
  //   }
  //   if (searchRequest.location) {
  //     params = params.set('location', searchRequest.location);
  //   }
  //   if (searchRequest.skills && searchRequest.skills.length > 0) {
  //     searchRequest.skills.forEach(skill => {
  //       params = params.append('skills', skill);
  //     });
  //   }
  //   if (searchRequest.experienceLevel) {
  //     params = params.set('experienceLevel', searchRequest.experienceLevel);
  //   }
  //   if (searchRequest.jobType) {
  //     params = params.set('jobType', searchRequest.jobType);
  //   }
    
  //   params = params.set('page', (searchRequest.page || 0).toString());
  //   params = params.set('size', (searchRequest.size || 10).toString());
  //   params = params.set('sortBy', searchRequest.sortBy || 'createdAt');
  //   params = params.set('sortDirection', searchRequest.sortDirection || 'DESC');

  //   return this.http.get<PageResponse<Job>>(`${this.apiUrl}/search`, { params });
  // }
}
