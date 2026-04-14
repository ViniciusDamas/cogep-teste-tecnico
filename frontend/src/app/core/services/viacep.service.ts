import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ViaCepData } from '../models';

@Injectable({ providedIn: 'root' })
export class ViaCepService {
  constructor(private http: HttpClient) {}

  lookup(cep: string): Observable<ViaCepData> {
    const clean = cep.replace(/\D/g, '');
    return this.http.get<ViaCepData>(`${environment.apiUrl}/geocoding/cep/${clean}`);
  }
}
