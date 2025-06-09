import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyWithMediaDto } from '../interfaces/CompanyWithMediaDto';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
private baseUrl = 'http://localhost:8080/api/companies';
   constructor(private http: HttpClient) {}

  searchCompanies(companyName: string): Observable<CompanyWithMediaDto[]> {
    return this.http.get<CompanyWithMediaDto[]>(`${this.baseUrl}/search`, {
      params: { companyName }
    });
  }

  getCompanyById(companyId: number): Observable<CompanyWithMediaDto> {
    return this.http.get<CompanyWithMediaDto>(`${this.baseUrl}/${companyId}`);
  }
}
