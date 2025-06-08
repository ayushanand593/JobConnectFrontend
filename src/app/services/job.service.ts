import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { PageResponse } from '../interfaces/PageResponse';
import { Job } from '../interfaces/Job';
import { JobSearchRequest } from '../interfaces/JobSearchRequest';
import { DisclosureQuestion } from '../interfaces/DisclosureQuestion';
import { JobDisclosureQuestionsDTO } from '../interfaces/JobDisclosureQuestionsDTO';
import { JobApplicationSubmissionDTO } from '../interfaces/JobApplicationSubmissionDTO';
import { JobApplicationDTO } from '../interfaces/JobApplicationDTO';
import { JobCreateDTO } from '../interfaces/JobCreateDTO';

@Injectable({
  providedIn: 'root'
})
export class JobService {
private apiUrl = 'https://zclcl1fq-8080.inc1.devtunnels.ms/api/jobs'; // Adjust base URL as needed

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

 createJob(jobData: JobCreateDTO): Observable<Job> {
    return this.http.post<Job>(`${this.apiUrl}/create-job`, jobData);
  }

  updateJob(jobId: string, jobData: JobCreateDTO): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/jobId/${jobId}`, jobData);
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
getAvailableSkills(): Observable<string[]> {
    // For now returning static list, but you can modify to fetch from backend
    return of([
      'JavaScript', 'TypeScript', 'Angular', 'React', 'Vue.js', 'Node.js',
      'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
      'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind CSS',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'ElasticSearch',
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins',
      'Git', 'Agile', 'Scrum', 'Project Management', 'Communication',
      'Problem Solving', 'Team Leadership', 'Mentoring'
    ]);
  }
 
}
