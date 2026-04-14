import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity, AuditLog } from '../models';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly base = `${environment.apiUrl}/activities`;

  constructor(private http: HttpClient) {}

  list(filter: { stageId?: string; personId?: string } = {}): Observable<Activity[]> {
    let params = new HttpParams();
    if (filter.stageId) params = params.set('stageId', filter.stageId);
    if (filter.personId) params = params.set('personId', filter.personId);
    return this.http.get<Activity[]>(this.base, { params });
  }

  get(id: string): Observable<Activity> {
    return this.http.get<Activity>(`${this.base}/${id}`);
  }

  create(payload: Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(this.base, payload);
  }

  update(id: string, payload: Partial<Activity>): Observable<Activity> {
    return this.http.put<Activity>(`${this.base}/${id}`, payload);
  }

  moveStage(id: string, stageId: string): Observable<Activity> {
    return this.http.patch<Activity>(`${this.base}/${id}/stage`, { stageId });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  history(id: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/${id}/history`);
  }
}
