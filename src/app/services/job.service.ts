import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '../interfaces/PageResponse';
import { Job } from '../interfaces/Job';

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
}
