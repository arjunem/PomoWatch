import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Session, StartSessionRequest } from '../models/session.model';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Health Check
  getHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  getDetailedHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health/detailed`);
  }

  // Session Management
  getAllSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/sessions`);
  }

  getSessionById(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/sessions/${id}`);
  }

  getActiveSession(): Observable<Session | null> {
    return this.http.get<Session>(`${this.baseUrl}/sessions/active`);
  }

  startWorkSession(request: StartSessionRequest): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/start-work`, request);
  }

  startBreakSession(request: StartSessionRequest): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/start-break`, request);
  }

  pauseSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/pause`, {});
  }

  resumeSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/resume`, {});
  }

  completeSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/complete`, {});
  }

  cancelSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/cancel`, {});
  }

  updateSession(id: number, session: Session): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/sessions/${id}`, session);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${id}`);
  }

  getSessionsByDateRange(startDate: Date, endDate: Date): Observable<Session[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<Session[]>(`${this.baseUrl}/sessions/date-range`, { params });
  }

  getSessionsByType(type: 'work' | 'break'): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/sessions/type/${type}`);
  }

  // Error Handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Bad Request';
          break;
        case 401:
          errorMessage = 'Unauthorized';
          break;
        case 403:
          errorMessage = 'Forbidden';
          break;
        case 404:
          errorMessage = error.error?.message || 'Not Found';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflict';
          break;
        case 500:
          errorMessage = 'Internal Server Error';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

// Session Statistics Service
@Injectable({
  providedIn: 'root'
})
export class SessionStatsService {
  constructor(private apiService: ApiService) {}

  getTodayStats(): Observable<{
    totalWorkTime: number;
    totalBreakTime: number;
    completedSessions: number;
    totalSessions: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.apiService.getSessionsByDateRange(startOfDay, endOfDay).pipe(
      map(sessions => {
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const workSessions = completedSessions.filter(s => s.type === 'work');
        const breakSessions = completedSessions.filter(s => s.type === 'break');

        const totalWorkTime = workSessions.reduce((total, session) => {
          return total + session.durationMinutes;
        }, 0);

        const totalBreakTime = breakSessions.reduce((total, session) => {
          return total + session.durationMinutes;
        }, 0);

        return {
          totalWorkTime,
          totalBreakTime,
          completedSessions: completedSessions.length,
          totalSessions: sessions.length
        };
      })
    );
  }

  getWeeklyStats(): Observable<{
    dailyStats: Array<{
      date: string;
      workTime: number;
      breakTime: number;
      sessions: number;
    }>;
    totalWorkTime: number;
    totalBreakTime: number;
    totalSessions: number;
  }> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.apiService.getSessionsByDateRange(weekAgo, today).pipe(
      map(sessions => {
        const dailyStats = new Map<string, {
          workTime: number;
          breakTime: number;
          sessions: number;
        }>();

        // Initialize daily stats
        for (let i = 0; i < 7; i++) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const dateKey = date.toISOString().split('T')[0];
          dailyStats.set(dateKey, { workTime: 0, breakTime: 0, sessions: 0 });
        }

        // Aggregate session data
        sessions.forEach(session => {
          if (session.status === 'completed') {
            const dateKey = new Date(session.startTime).toISOString().split('T')[0];
            const dayStats = dailyStats.get(dateKey);
            
            if (dayStats) {
              dayStats.sessions++;
              if (session.type === 'work') {
                dayStats.workTime += session.durationMinutes;
              } else {
                dayStats.breakTime += session.durationMinutes;
              }
            }
          }
        });

        // Convert to array and calculate totals
        const dailyStatsArray = Array.from(dailyStats.entries()).map(([date, stats]) => ({
          date,
          ...stats
        }));

        const totalWorkTime = dailyStatsArray.reduce((total, day) => total + day.workTime, 0);
        const totalBreakTime = dailyStatsArray.reduce((total, day) => total + day.breakTime, 0);
        const totalSessions = dailyStatsArray.reduce((total, day) => total + day.sessions, 0);

        return {
          dailyStats: dailyStatsArray,
          totalWorkTime,
          totalBreakTime,
          totalSessions
        };
      })
    );
  }
}
