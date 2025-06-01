import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PageResponse } from '../interfaces/PageResponse';
import { Job } from '../interfaces/Job';
import { JobSearchRequest } from '../interfaces/JobSearchRequest';
import { DisclosureQuestion } from '../interfaces/DisclosureQuestion';
import { JobDisclosureQuestionsDTO } from '../interfaces/JobDisclosureQuestionsDTO';
import { JobApplicationSubmissionDTO } from '../interfaces/JobApplicationSubmissionDTO';
import { JobApplicationDTO } from '../interfaces/JobApplicationDTO';

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
   getJobDisclosureQuestions(jobId: string): Observable<DisclosureQuestion[]> {
    return this.http
      .get<JobDisclosureQuestionsDTO>(`${this.apiUrl}/${jobId}/disclosure-questions`)
      .pipe(
        // Pull out the `disclosureQuestions` field from the wrapper object
        map((wrapper) => wrapper.disclosureQuestions || [])
      );
  }

  // Add new method that returns the full DTO
  getJobDisclosureQuestionsRaw(jobId: string): Observable<JobDisclosureQuestionsDTO> {
    return this.http.get<JobDisclosureQuestionsDTO>(`${this.apiUrl}/${jobId}/disclosure-questions`);
  }

  applyToJob(
    jobId: string, 
    applicationData: JobApplicationSubmissionDTO,
    resumeFile?: File,
    coverLetterFile?: File
  ): Observable<JobApplicationDTO> {
    const formData = new FormData();
    
    // Add application data as JSON
    formData.append('applicationData', new Blob([JSON.stringify(applicationData)], {
      type: 'application/json'
    }));
    
    // Add files if provided
    if (resumeFile) {
      formData.append('resumeFile', resumeFile);
    }
    
    if (coverLetterFile) {
      formData.append('coverLetterFile', coverLetterFile);
    }
    
    return this.http.post<JobApplicationDTO>(`${this.apiUrl}/apply/${jobId}`, formData);
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
