import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Session } from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private readonly SESSIONS_KEY = 'pomodoro_sessions';
  private readonly ACTIVE_SESSION_KEY = 'pomodoro_active_session';
  private readonly SETTINGS_KEY = 'pomodoro_settings';

  private sessionsSubject = new BehaviorSubject<Session[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  constructor() {
    this.loadSessions();
  }

  /**
   * Load sessions from localStorage
   */
  private loadSessions(): void {
    try {
      const sessionsData = localStorage.getItem(this.SESSIONS_KEY);
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        this.sessionsSubject.next(sessions);
        console.log('OfflineStorageService: Loaded sessions from localStorage:', sessions.length);
      }
    } catch (error) {
      console.error('OfflineStorageService: Failed to load sessions from localStorage:', error);
      this.sessionsSubject.next([]);
    }
  }

  /**
   * Save sessions to localStorage
   */
  private saveSessions(sessions: Session[]): void {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
      console.log('OfflineStorageService: Saved sessions to localStorage:', sessions.length);
    } catch (error) {
      console.error('OfflineStorageService: Failed to save sessions to localStorage:', error);
    }
  }

  /**
   * Add a new session
   */
  addSession(session: Session): void {
    const currentSessions = this.sessionsSubject.value;
    const updatedSessions = [...currentSessions, session];
    this.sessionsSubject.next(updatedSessions);
    this.saveSessions(updatedSessions);
  }

  /**
   * Update an existing session
   */
  updateSession(updatedSession: Session): void {
    const currentSessions = this.sessionsSubject.value;
    const updatedSessions = currentSessions.map(session => 
      session.id === updatedSession.id ? updatedSession : session
    );
    this.sessionsSubject.next(updatedSessions);
    this.saveSessions(updatedSessions);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: number): void {
    const currentSessions = this.sessionsSubject.value;
    const updatedSessions = currentSessions.filter(session => session.id !== sessionId);
    this.sessionsSubject.next(updatedSessions);
    this.saveSessions(updatedSessions);
  }

  /**
   * Get all sessions
   */
  getSessions(): Session[] {
    return this.sessionsSubject.value;
  }

  /**
   * Get recent sessions (last 10)
   */
  getRecentSessions(): Session[] {
    const sessions = this.sessionsSubject.value;
    return sessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
  }

  /**
   * Get today's sessions
   */
  getTodaySessions(): Session[] {
    const today = new Date().toDateString();
    return this.sessionsSubject.value.filter(session => 
      new Date(session.startTime).toDateString() === today
    );
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessionsSubject.next([]);
    this.saveSessions([]);
  }

  /**
   * Save active session
   */
  saveActiveSession(session: Session | null): void {
    try {
      if (session) {
        localStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(this.ACTIVE_SESSION_KEY);
      }
    } catch (error) {
      console.error('OfflineStorageService: Failed to save active session:', error);
    }
  }

  /**
   * Load active session
   */
  loadActiveSession(): Session | null {
    try {
      const sessionData = localStorage.getItem(this.ACTIVE_SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('OfflineStorageService: Failed to load active session:', error);
    }
    return null;
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: any): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      console.log('OfflineStorageService: Saved settings to localStorage');
    } catch (error) {
      console.error('OfflineStorageService: Failed to save settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): any {
    try {
      const settingsData = localStorage.getItem(this.SETTINGS_KEY);
      if (settingsData) {
        return JSON.parse(settingsData);
      }
    } catch (error) {
      console.error('OfflineStorageService: Failed to load settings:', error);
    }
    return null;
  }

  /**
   * Get today's statistics
   */
  getTodayStats(): any {
    const todaySessions = this.getTodaySessions();
    const completedSessions = todaySessions.filter(s => s.status === 'completed');
    
    const totalWorkTime = completedSessions
      .filter(s => s.type === 'work')
      .reduce((total, session) => total + session.durationMinutes, 0);
    
    const totalBreakTime = completedSessions
      .filter(s => s.type === 'break')
      .reduce((total, session) => total + session.durationMinutes, 0);

    return {
      totalWorkTime,
      totalBreakTime,
      completedSessions: completedSessions.length,
      totalSessions: todaySessions.length
    };
  }
}
