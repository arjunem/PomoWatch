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

  // ===== HEALTH CHECK ENDPOINTS =====
  
  /**
   * Performs a basic health check to verify API connectivity
   * Returns simple status information
   */
  getHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  /**
   * Performs a detailed health check including database connectivity
   * Returns comprehensive system status and session information
   */
  getDetailedHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health/detailed`);
  }

  // ===== SESSION MANAGEMENT ENDPOINTS =====
  
  /**
   * Retrieves all Pomodoro sessions from the backend
   * Returns an array of all sessions in the database
   */
  getAllSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/sessions`);
  }

  /**
   * Retrieves a specific session by its ID
   * Returns the session data or throws an error if not found
   */
  getSessionById(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/sessions/${id}`);
  }

  /**
   * Retrieves the currently active (running or paused) session
   * Returns null if no active session exists
   */
  getActiveSession(): Observable<Session | null> {
    return this.http.get<Session>(`${this.baseUrl}/sessions/active`);
  }

  /**
   * Starts a new work session with the specified duration
   * Creates a new session record in the backend
   */
  startWorkSession(request: StartSessionRequest): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/start-work`, request);
  }

  /**
   * Starts a new break session with the specified duration
   * Creates a new break session record in the backend
   */
  startBreakSession(request: StartSessionRequest): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/start-break`, request);
  }

  /**
   * Pauses an active session by its ID
   * Changes session status to 'paused' and records pause time
   */
  pauseSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/pause`, {});
  }

  /**
   * Resumes a paused session by its ID
   * Changes session status back to 'running'
   */
  resumeSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/resume`, {});
  }

  /**
   * Marks a session as completed by its ID
   * Changes status to 'completed' and records end time
   */
  completeSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/complete`, {});
  }

  /**
   * Cancels a session by its ID
   * Changes status to 'cancelled' and records end time
   */
  cancelSession(id: number): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/sessions/${id}/cancel`, {});
  }

  /**
   * Updates an existing session with new data
   * Replaces the entire session object in the backend
   */
  updateSession(id: number, session: Session): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/sessions/${id}`, session);
  }

  /**
   * Deletes a session by its ID
   * Permanently removes the session from the database
   */
  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${id}`);
  }

  /**
   * Retrieves sessions within a specific date range
   * Useful for generating reports and analytics
   */
  getSessionsByDateRange(startDate: Date, endDate: Date): Observable<Session[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    return this.http.get<Session[]>(`${this.baseUrl}/sessions/date-range`, { params });
  }

  /**
   * Retrieves sessions filtered by type (work or break)
   * Useful for analyzing productivity patterns
   */
  getSessionsByType(type: 'work' | 'break'): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.baseUrl}/sessions/type/${type}`);
  }

  // ===== ERROR HANDLING =====
  
  /**
   * Centralized error handling for all HTTP requests
   * Converts HTTP errors into user-friendly error messages
   */
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

// ===== SESSION STATISTICS SERVICE =====

/**
 * Service for calculating and retrieving Pomodoro session statistics
 * Provides analytics for productivity tracking and reporting
 */
@Injectable({
  providedIn: 'root'
})
export class SessionStatsService {
  constructor(private apiService: ApiService) {}

  /**
   * Calculates statistics for the current day
   * Returns total work time, break time, and session counts
   */
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

  /**
   * Calculates statistics for the past 7 days
   * Returns daily breakdown and weekly totals for work/break time and sessions
   */
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

        // Initialize daily stats for the past 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const dateKey = date.toISOString().split('T')[0];
          dailyStats.set(dateKey, { workTime: 0, breakTime: 0, sessions: 0 });
        }

        // Aggregate session data by date
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

        // Convert to array and calculate weekly totals
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
