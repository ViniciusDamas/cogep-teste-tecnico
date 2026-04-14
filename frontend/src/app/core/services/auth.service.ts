import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserSummary } from '../models';

const TOKEN_KEY = 'cogep.token';
const USER_KEY = 'cogep.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth`;
  private readonly user$ = new BehaviorSubject<UserSummary | null>(this.readUser());

  constructor(private http: HttpClient) {}

  register(payload: { name: string; email: string; password: string }): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${this.base}/register`, payload);
  }

  login(payload: {
    email: string;
    password: string;
  }): Observable<{ token: string; user: UserSummary }> {
    return this.http.post<{ token: string; user: UserSummary }>(`${this.base}/login`, payload).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.user$.next(res.user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  currentUser(): Observable<UserSummary | null> {
    return this.user$.asObservable();
  }

  private readUser(): UserSummary | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserSummary) : null;
  }
}
