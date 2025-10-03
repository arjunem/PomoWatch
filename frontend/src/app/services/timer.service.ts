import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription, EMPTY } from 'rxjs';
import { map, takeWhile, catchError } from 'rxjs/operators';
import { TimerState, Session, PomodoroSettings, StartSessionRequest } from '../models/session.model';
import { ApiService } from './api.service';
import { SettingsService, PomodoroSettingsDto } from './settings.service';
import { parseUtcDate, calculateElapsedSeconds, minutesToSeconds } from '../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timerStateSubject = new BehaviorSubject<TimerState>({
    currentSession: null,
    remainingTime: 0,
    isRunning: false,
    isPaused: false,
    sessionType: 'work',
    totalDuration: 25 * 60 // 25 minutes in seconds
  });

         private settingsSubject = new BehaviorSubject<PomodoroSettings>({
           workDuration: 25,
           breakDuration: 5,
           longBreakDuration: 15,
           sessionsUntilLongBreak: 4,
           autoStartBreaks: false,
           autoStartPomodoros: false,
           soundEnabled: true
         });

         private sessionChangeSubject = new BehaviorSubject<boolean>(false);
         private timerSubscription?: Subscription;
         private workSessionCount = 0;

  // Observable streams
  public timerState$: Observable<TimerState> = this.timerStateSubject.asObservable();
  public settings$: Observable<PomodoroSettings> = this.settingsSubject.asObservable();
  public sessionChange$: Observable<boolean> = this.sessionChangeSubject.asObservable();

  // Computed observables
  public remainingTime$: Observable<number> = this.timerState$.pipe(
    map(state => state.remainingTime)
  );

  public isRunning$: Observable<boolean> = this.timerState$.pipe(
    map(state => state.isRunning)
  );

  public currentSession$: Observable<Session | null> = this.timerState$.pipe(
    map(state => state.currentSession)
  );

  public progressPercentage$: Observable<number> = this.timerState$.pipe(
    map(state => {
      if (state.totalDuration === 0) return 0;
      return ((state.totalDuration - state.remainingTime) / state.totalDuration) * 100;
    })
  );

  public timeDisplay$: Observable<string> = this.timerState$.pipe(
    map(state => this.formatTime(state.remainingTime))
  );

  constructor(
    private apiService: ApiService,
    private settingsService: SettingsService
  ) {
    // Listen for settings changes and update timer service
    this.settingsService.settings$.subscribe(settings => {
      const frontendSettings: PomodoroSettings = {
        workDuration: settings.workDuration,
        breakDuration: settings.breakDuration,
        longBreakDuration: settings.longBreakDuration,
        sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
        autoStartBreaks: settings.autoStartBreaks,
        autoStartPomodoros: settings.autoStartPomodoros,
        soundEnabled: settings.soundEnabled
      };
      this.settingsSubject.next(frontendSettings);
      console.log('Settings updated in timer service:', frontendSettings);
    });
    // Defer API calls to avoid dependency injection issues during initialization
    setTimeout(() => this.loadActiveSession(), 0);
  }

  // ===== TIMER CONTROLS =====
  
  /**
   * Starts a new work session with the configured duration
   * Creates session in backend and increments the work session counter
   */
  startWorkSession(): void {
    const settings = this.settingsSubject.value;
    const duration = settings.workDuration;
    
    const request: StartSessionRequest = {
      durationMinutes: duration
    };

    this.apiService.startWorkSession(request)
      .pipe(
        catchError(error => {
          console.error('Failed to start work session:', error);
          // Fallback to local-only session if API fails
          this.startSessionLocal('work', duration * 60);
          this.workSessionCount++;
          return EMPTY;
        })
      )
      .subscribe(session => {
        this.startSessionWithBackendData(session, duration * 60);
        this.workSessionCount++;
      });
  }

  /**
   * Starts a new break session (short or long break based on session count)
   * Creates session in backend and handles long break logic
   */
  startBreakSession(): void {
    const settings = this.settingsSubject.value;
    const isLongBreak = this.workSessionCount >= settings.sessionsUntilLongBreak;
    const duration = isLongBreak ? settings.longBreakDuration : settings.breakDuration;
    
    const request: StartSessionRequest = {
      durationMinutes: duration
    };

    this.apiService.startBreakSession(request)
      .pipe(
        catchError(error => {
          console.error('Failed to start break session:', error);
          // Fallback to local-only session if API fails
          this.startSessionLocal('break', duration * 60);
          if (isLongBreak) {
            this.workSessionCount = 0; // Reset counter after long break
          }
          return EMPTY;
        })
      )
      .subscribe(session => {
        this.startSessionWithBackendData(session, duration * 60);
        
        if (isLongBreak) {
          this.workSessionCount = 0; // Reset counter after long break
        }
      });
  }

  /**
   * Internal method to start session with backend data
   * Uses the session object returned from the API
   */
  private startSessionWithBackendData(session: Session, duration: number): void {
    this.updateTimerState({
      currentSession: session,
      remainingTime: duration,
      isRunning: true,
      isPaused: false,
      sessionType: session.type as 'work' | 'break',
      totalDuration: duration
    });

    this.startTimer();
  }

  /**
   * Fallback method to start session locally when API fails
   * Creates a local session object without backend persistence
   */
  private startSessionLocal(type: 'work' | 'break', duration: number): void {
    const newSession: Session = {
      id: 0, // Local session, no backend ID
      type,
      startTime: new Date().toISOString(),
      status: 'running',
      durationMinutes: Math.floor(duration / 60),
      createdAt: new Date().toISOString()
    };

    this.updateTimerState({
      currentSession: newSession,
      remainingTime: duration,
      isRunning: true,
      isPaused: false,
      sessionType: type,
      totalDuration: duration
    });

    this.startTimer();
  }

  /**
   * Pauses the currently running timer
   * Updates session status in backend and stops local timer
   */
  pauseTimer(): void {
    const currentState = this.timerStateSubject.value;
    if (currentState.isRunning && currentState.currentSession) {
      if (currentState.currentSession.id > 0) {
        // Update backend session status (only if it has a valid backend ID)
        this.apiService.pauseSession(currentState.currentSession.id)
          .pipe(
            catchError(error => {
              console.error('Failed to pause session in backend:', error);
              // Continue with local pause even if backend fails
              return EMPTY;
            })
          )
          .subscribe({
            next: (updatedSession) => {
              // Update local state with backend data
              this.updateTimerState({
                currentSession: updatedSession,
                isRunning: false,
                isPaused: true
              });
              this.stopTimerInternal();
            },
            error: () => {
              // Handle any remaining errors and still pause locally
              this.updateTimerState({
                isRunning: false,
                isPaused: true
              });
              this.stopTimerInternal();
            }
          });
      } else {
        // Local-only session, just pause locally
        this.updateTimerState({
          isRunning: false,
          isPaused: true
        });
        this.stopTimerInternal();
      }
    }
  }

  /**
   * Resumes a paused timer
   * Updates session status in backend and starts local timer
   */
  resumeTimer(): void {
    const currentState = this.timerStateSubject.value;
    if (currentState.isPaused && currentState.currentSession) {
      if (currentState.currentSession.id > 0) {
        // Update backend session status (only if it has a valid backend ID)
        this.apiService.resumeSession(currentState.currentSession.id)
          .pipe(
            catchError(error => {
              console.error('Failed to resume session in backend:', error);
              // Continue with local resume even if backend fails
              return EMPTY;
            })
          )
          .subscribe({
            next: (updatedSession) => {
              // Update local state with backend data
              this.updateTimerState({
                currentSession: updatedSession,
                isRunning: true,
                isPaused: false
              });
              this.startTimer();
            },
            error: () => {
              // Handle any remaining errors and still resume locally
              this.updateTimerState({
                isRunning: true,
                isPaused: false
              });
              this.startTimer();
            }
          });
      } else {
        // Local-only session, just resume locally
        this.updateTimerState({
          isRunning: true,
          isPaused: false
        });
        this.startTimer();
      }
    }
  }

  /**
   * Stops the timer completely and cancels the session
   * Updates backend session status and resets local timer
   */
  stopTimer(): void {
    console.log('TimerService: stopTimer called');
    const currentState = this.timerStateSubject.value;
    
    if (currentState.currentSession && currentState.currentSession.id > 0) {
      // Cancel session in backend (only if it has a valid backend ID)
      this.apiService.cancelSession(currentState.currentSession.id)
        .pipe(
          catchError(error => {
            console.error('Failed to cancel session in backend:', error);
            // Continue with local stop even if backend fails
            return EMPTY;
          })
        )
        .subscribe({
          next: (cancelledSession) => {
            // Reset local state
            this.updateTimerState({
              isRunning: false,
              isPaused: false,
              remainingTime: 0,
              currentSession: null
            });
            this.stopTimerInternal();
            // Notify immediately after successful backend operation
            this.notifySessionChanged(); // Notify that sessions have changed
          },
          error: () => {
            // Handle any remaining errors and still stop locally
            this.updateTimerState({
              isRunning: false,
              isPaused: false,
              remainingTime: 0,
              currentSession: null
            });
            this.stopTimerInternal();
            // Notify immediately even on error since we stopped locally
            this.notifySessionChanged(); // Notify that sessions have changed
          }
        });
    } else {
      // No active session or local-only session, just stop locally
      this.updateTimerState({
        isRunning: false,
        isPaused: false,
        remainingTime: 0,
        currentSession: null
      });
      this.stopTimerInternal();
      // Notify immediately for local-only sessions
      this.notifySessionChanged(); // Notify that sessions have changed
    }
  }

  /**
   * Resets the timer to its original duration without changing session type
   * Stops the timer and sets remaining time back to total duration
   */
  resetTimer(): void {
    console.log('TimerService: resetTimer called');
    const currentState = this.timerStateSubject.value;
    this.updateTimerState({
      remainingTime: currentState.totalDuration,
      isRunning: false,
      isPaused: false,
      currentSession: null // Clear current session on reset
    });
    this.stopTimerInternal();
    this.notifySessionChanged(); // Notify that sessions have changed
  }

  // ===== TIMER LOGIC =====
  
  /**
   * Starts the internal countdown timer using RxJS interval
   * Decrements remaining time every second and handles completion
   */
  private startTimer(): void {
    this.stopTimerInternal(); // Stop any existing timer
    
    this.timerSubscription = interval(1000)
      .pipe(
        takeWhile(() => this.timerStateSubject.value.isRunning)
      )
      .subscribe(() => {
        const currentState = this.timerStateSubject.value;
        const newRemainingTime = Math.max(0, currentState.remainingTime - 1);
        
        this.updateTimerState({
          remainingTime: newRemainingTime
        });

        // Check if timer finished
        if (newRemainingTime === 0) {
          this.onTimerComplete();
        }
      });
  }

  /**
   * Stops the internal countdown timer and cleans up subscription
   * Called internally to prevent memory leaks
   */
  private stopTimerInternal(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  /**
   * Handles timer completion events
   * Completes session in backend, plays notification sound, and optionally auto-starts next session
   */
  private onTimerComplete(): void {
    const currentState = this.timerStateSubject.value;
    
    // Complete session in backend
    if (currentState.currentSession) {
      this.apiService.completeSession(currentState.currentSession.id)
        .pipe(
          catchError(error => {
            console.error('Failed to complete session in backend:', error);
            // Continue with local completion even if backend fails
            return EMPTY;
          })
        )
        .subscribe({
          next: (completedSession) => {
          // Update local state with completed session data
          this.updateTimerState({
            currentSession: completedSession,
            isRunning: false,
            isPaused: false,
            remainingTime: 0
          });

          // Play notification sound if enabled
          if (this.settingsSubject.value.soundEnabled) {
            this.playNotificationSound();
          }

          // Auto-start next session based on settings
          this.handleAutoStartNextSession(currentState.sessionType);
          this.notifySessionChanged(); // Notify that sessions have changed
          },
          error: () => {
            // Handle any remaining errors and still complete locally
            this.updateTimerState({
              isRunning: false,
              isPaused: false,
              remainingTime: 0
            });

            // Play notification sound if enabled
            if (this.settingsSubject.value.soundEnabled) {
              this.playNotificationSound();
            }

            // Auto-start next session based on settings
            this.handleAutoStartNextSession(currentState.sessionType);
            this.notifySessionChanged(); // Notify that sessions have changed
          }
        });
    } else {
      // No backend session, handle locally
      this.updateTimerState({
        isRunning: false,
        isPaused: false,
        remainingTime: 0
      });

      // Play notification sound if enabled
      if (this.settingsSubject.value.soundEnabled) {
        this.playNotificationSound();
      }

      // Auto-start next session based on settings
      this.handleAutoStartNextSession(currentState.sessionType);
      this.notifySessionChanged(); // Notify that sessions have changed
    }
  }

  /**
   * Handles auto-starting the next session based on current session type and settings
   * Waits for current session completion before starting the next session
   */
  private handleAutoStartNextSession(currentSessionType: 'work' | 'break'): void {
    const settings = this.settingsSubject.value;
    
    if (currentSessionType === 'work' && settings.autoStartBreaks) {
      // Start break session after current session is completed
      this.startBreakSession();
    } else if (currentSessionType === 'break' && settings.autoStartPomodoros) {
      // Start work session after current session is completed
      this.startWorkSession();
    }
  }

  // ===== SESSION PERSISTENCE =====
  
  /**
   * Loads any active session from the backend on service initialization
   * Restores timer state if there's an unfinished session
   */
  private loadActiveSession(): void {
    this.apiService.getActiveSession()
      .pipe(
        catchError(error => {
          console.log('No active session found or API unavailable:', error.message);
          return EMPTY;
        })
      )
      .subscribe({
        next: (activeSession) => {
          if (activeSession) {
            // Calculate remaining time based on session start time and duration
            const sessionStart = parseUtcDate(activeSession.startTime);
            const sessionDuration = minutesToSeconds(activeSession.durationMinutes);
            const elapsed = calculateElapsedSeconds(sessionStart);
            const remaining = Math.max(0, sessionDuration - elapsed);
            
            this.updateTimerState({
              currentSession: activeSession,
              remainingTime: remaining,
              isRunning: activeSession.status === 'running',
              isPaused: activeSession.status === 'paused',
              sessionType: activeSession.type as 'work' | 'break',
              totalDuration: sessionDuration
            });

            // Start timer if session was running
            if (activeSession.status === 'running' && remaining > 0) {
              this.startTimer();
            }
          }
        },
        error: (error) => {
          console.log('Error loading active session:', error);
        }
      });
  }

  // ===== SETTINGS MANAGEMENT =====
  
  /**
   * Updates the Pomodoro settings with new values
   * Merges with existing settings and saves to localStorage
   */
  updateSettings(settings: Partial<PomodoroSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
  }


  /**
   * Saves current settings to backend for persistence
   */
  private saveSettings(settings: PomodoroSettings): void {
    // Convert frontend interface to backend DTO
    const backendSettings: PomodoroSettingsDto = {
      workDuration: settings.workDuration,
      breakDuration: settings.breakDuration,
      longBreakDuration: settings.longBreakDuration,
      sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
      autoStartBreaks: settings.autoStartBreaks,
      autoStartPomodoros: settings.autoStartPomodoros,
      soundEnabled: settings.soundEnabled
    };
    
    this.settingsService.updateSettings(backendSettings).subscribe({
      next: () => {
        console.log('Settings saved to backend');
      },
      error: (error) => {
        console.error('Failed to save settings to backend:', error);
      }
    });
  }

  // ===== UTILITY METHODS =====
  
  /**
   * Updates the timer state with partial updates
   * Merges new values with existing state and emits to subscribers
   */
  private updateTimerState(updates: Partial<TimerState>): void {
    const currentState = this.timerStateSubject.value;
    this.timerStateSubject.next({ ...currentState, ...updates });
  }

  /**
   * Formats seconds into MM:SS display format
   * Used for timer display in the UI
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Plays a notification sound using Web Audio API
   * Creates a simple beep sound when timer completes
   */
  private playNotificationSound(): void {
    // Simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Getters for current state
  get currentState(): TimerState {
    return this.timerStateSubject.value;
  }

  get currentSettings(): PomodoroSettings {
    return this.settingsSubject.value;
  }

  get currentWorkSessionCount(): number {
    return this.workSessionCount;
  }

  /**
   * Notifies other components that the session list has changed
   * Triggers a refresh of session-related data
   */
  public notifySessionChanged(): void {
    console.log('TimerService: Notifying session changed');
    this.sessionChangeSubject.next(true);
  }
}
