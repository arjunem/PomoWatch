import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TimerService } from './services/timer.service';
import { ApiService } from './services/api.service';
import { SettingsService } from './services/settings.service';
import { Session, TimerState, PomodoroSettings } from './models/session.model';
import { SessionHistoryComponent } from './components/session-history/session-history.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TodayProgressComponent } from './components/today-progress/today-progress.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SessionHistoryComponent, TodayProgressComponent, SettingsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ===== OBSERVABLE STREAMS =====
  // Timer state observables for reactive UI updates
  timerState$: Observable<TimerState>;
  remainingTime$: Observable<string>;
  isRunning$: Observable<boolean>;
  progressPercentage$: Observable<number>;
  currentSession$: Observable<Session | null>;

  // Settings observable for user preferences
  settings$: Observable<PomodoroSettings>;
  
  // Settings modal state
  showSettingsModal = false;

  constructor(
    private timerService: TimerService,
    private apiService: ApiService,
    private settingsService: SettingsService
  ) {
    // Initialize observable streams from timer service
    this.timerState$ = this.timerService.timerState$;
    this.remainingTime$ = this.timerService.timeDisplay$;
    this.isRunning$ = this.timerService.isRunning$;
    this.progressPercentage$ = this.timerService.progressPercentage$;
    this.currentSession$ = this.timerService.currentSession$;
    this.settings$ = this.timerService.settings$;
  }

  /**
   * Component initialization lifecycle hook
   * Performs API health check to verify backend connectivity
   */
  ngOnInit(): void {
    // Check API connectivity on startup
    this.apiService.getHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => console.log('API Health Check:', response),
        error: (error) => console.error('API Connection Error:', error)
      });

    // Ensure settings are loaded on app startup by subscribing to settings$
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => console.log('Settings loaded on app startup:', settings),
        error: (error) => console.error('Failed to load settings on startup:', error)
      });
  }

  /**
   * Component destruction lifecycle hook
   * Cleans up subscriptions to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== TIMER CONTROL METHODS =====
  // These methods delegate to the timer service for business logic

  /**
   * Starts a new work session with configured duration
   * Delegate to timer service for implementation
   */
  startWorkSession(): void {
    this.timerService.startWorkSession();
  }

  /**
   * Starts a new break session (short or long based on session count)
   * Delegate to timer service for implementation
   */
  startBreakSession(): void {
    this.timerService.startBreakSession();
  }

  /**
   * Pauses the currently running timer
   * Delegate to timer service for implementation
   */
  pauseTimer(): void {
    this.timerService.pauseTimer();
  }

  /**
   * Resumes a paused timer
   * Delegate to timer service for implementation
   */
  resumeTimer(): void {
    this.timerService.resumeTimer();
  }

  /**
   * Stops the timer completely and resets to 0
   * Delegate to timer service for implementation
   */
  stopTimer(): void {
    console.log('App: stopTimer called');
    this.timerService.stopTimer();
  }

  /**
   * Resets the timer to its original duration
   * Delegate to timer service for implementation
   */
  resetTimer(): void {
    console.log('App: resetTimer called');
    this.timerService.resetTimer();
  }

  // ===== SETTINGS METHODS =====

  /**
   * Shows the settings modal
   */
  showSettings(): void {
    this.showSettingsModal = true;
  }

  /**
   * Hides the settings modal
   */
  hideSettings(): void {
    this.showSettingsModal = false;
  }
}
