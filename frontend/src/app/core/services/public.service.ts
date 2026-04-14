import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReurbStage } from '../models';

export interface PublicActivityView {
  protocol: string;
  name: string;
  stage: ReurbStage;
  startDate: string;
  endDate: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PublicService {
  constructor(private http: HttpClient) {}

  consult(protocol: string): Observable<PublicActivityView> {
    return this.http.get<PublicActivityView>(
      `${environment.apiUrl}/public/consulta/${encodeURIComponent(protocol)}`,
    );
  }
}
