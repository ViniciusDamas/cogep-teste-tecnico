import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReurbStage } from '../models';

@Injectable({ providedIn: 'root' })
export class StageService {
  private readonly base = `${environment.apiUrl}/stages`;

  constructor(private http: HttpClient) {}

  list(): Observable<ReurbStage[]> {
    return this.http.get<ReurbStage[]>(this.base);
  }
}
