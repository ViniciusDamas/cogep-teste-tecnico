import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog, Person } from '../models';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly base = `${environment.apiUrl}/persons`;

  constructor(private http: HttpClient) {}

  list(q?: string): Observable<Person[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Person[]>(this.base, { params });
  }

  get(id: string): Observable<Person> {
    return this.http.get<Person>(`${this.base}/${id}`);
  }

  create(payload: Partial<Person>): Observable<Person> {
    return this.http.post<Person>(this.base, payload);
  }

  update(id: string, payload: Partial<Person>): Observable<Person> {
    return this.http.put<Person>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  history(id: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/${id}/history`);
  }
}
