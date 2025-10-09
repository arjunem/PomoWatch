import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TimerService } from './services/timer.service';
import { ApiService } from './services/api.service';
import { SettingsService } from './services/settings.service';
import { OfflineService } from './services/offline.service';
import { ToastService } from './services/toast.service';
import { Session, TimerState, PomodoroSettings } from './models/session.model';
import { SessionHistoryComponent } from './components/session-history/session-history.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TodayProgressComponent } from './components/today-progress/today-progress.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SessionHistoryComponent, TodayProgressComponent, SettingsComponent, ToastComponent],
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
  isPaused$: Observable<boolean>;
  hasActiveSession$: Observable<boolean>;
  progressPercentage$: Observable<number>;
  currentSession$: Observable<Session | null>;

  // Settings observable for user preferences
  settings$: Observable<PomodoroSettings>;
  
  // Offline mode observable
  isOffline$: Observable<boolean>;
  isOffline: boolean = false; // Local state for toggle switch
  
  // Settings modal state
  showSettingsModal = false;
  
  // Reset confirmation modal state
  showResetConfirmationModal = false;

  constructor(
    private timerService: TimerService,
    private apiService: ApiService,
    private settingsService: SettingsService,
    private offlineService: OfflineService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize observable streams from timer service
    this.timerState$ = this.timerService.timerState$;
    this.remainingTime$ = this.timerService.timeDisplay$;
    this.isRunning$ = this.timerService.isRunning$;
    this.isPaused$ = this.timerService.isPaused$;
    this.hasActiveSession$ = this.timerService.hasActiveSession$;
    this.progressPercentage$ = this.timerService.progressPercentage$;
    this.currentSession$ = this.timerService.currentSession$;
    this.settings$ = this.timerService.settings$;
    this.isOffline$ = this.offlineService.isOffline$;
    
    // Subscribe to offline state changes to update local state
    this.isOffline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOffline => {
        console.log('App: Offline state changed to:', isOffline);
        this.isOffline = isOffline;
        // Force change detection to update the UI
        this.cdr.detectChanges();
      });
  }

  /**
   * Component initialization lifecycle hook
   * Performs API health check to verify backend connectivity
   */
  ngOnInit(): void {
    // Check API connectivity on startup and switch to offline mode if unavailable
    this.apiService.getHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Health Check: Available');
          // API is available, ensure we're not in offline mode
          this.offlineService.setOfflineMode(false);
        },
        error: (error) => {
          console.error('API Connection Error:', error);
          console.log('Switching to offline mode due to API unavailability');
          // API is not available, switch to offline mode
          this.offlineService.setOfflineMode(true);
        }
      });

    // Ensure settings are loaded on app startup by subscribing to settings$
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          console.log('Settings loaded on app startup:', settings);
          // If settings indicate offline mode, ensure offline service reflects this
          if (settings.offlineMode) {
            this.offlineService.setOfflineMode(true);
          }
        },
        error: (error) => {
          console.error('Failed to load settings on startup:', error);
          // If settings can't be loaded, switch to offline mode
          this.offlineService.setOfflineMode(true);
        }
      });
  }

  /**
   * Toggle offline mode with health check
   */
  async toggleOfflineMode(toggleElement?: HTMLInputElement): Promise<void> {
    const currentOfflineState = this.offlineService.isOffline;
    console.log('App: Toggle clicked, current offline state:', currentOfflineState);
    
    if (currentOfflineState) {
      // Switching from offline to online - check API health
      console.log('App: Checking API health before switching to online mode...');
      const isApiAvailable = await this.offlineService.checkApiHealth();
      
      if (isApiAvailable) {
        console.log('App: API is available, switching to online mode');
        this.offlineService.setOfflineMode(false);
        
        // Update settings to reflect online mode
        const currentSettings = this.settingsService.currentSettings;
        const updatedSettings = { ...currentSettings, offlineMode: false };
        this.settingsService.updateSettings(updatedSettings).subscribe({
          next: () => {
            console.log('App: Settings updated to online mode');
            this.toastService.success('Switched to online mode successfully');
            // Refresh the page to sync with backend
            window.location.reload();
          },
          error: (error) => {
            console.error('App: Failed to update settings:', error);
            this.toastService.error('Failed to update settings');
          }
        });
      } else {
        console.log('App: API is not available, staying in offline mode');
        // Force the toggle switch to reflect offline state
        this.offlineService.setOfflineMode(true);
        // Also update local state directly to ensure UI updates
        this.isOffline = true;
        // Force change detection to update the toggle switch immediately
        this.cdr.detectChanges();
        // Manually reset the checkbox if element is available
        if (toggleElement) {
          toggleElement.checked = true;
        }
        this.toastService.error('Server not available. Staying in offline mode.');
      }
    } else {
      // Switching from online to offline
      console.log('App: Switching to offline mode');
      this.offlineService.setOfflineMode(true);
      
      // Update settings to reflect offline mode
      const currentSettings = this.settingsService.currentSettings;
      const updatedSettings = { ...currentSettings, offlineMode: true };
      this.settingsService.updateSettings(updatedSettings).subscribe({
        next: () => {
          console.log('App: Settings updated to offline mode');
          this.toastService.success('Switched to offline mode');
        },
        error: (error) => {
          console.error('App: Failed to update settings:', error);
          this.toastService.error('Failed to update settings');
        }
      });
    }
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
   * Shows confirmation dialog if there's an active or paused session
   */
  resetTimer(): void {
    console.log('App: resetTimer called');
    
    // Check if there's an active or paused session
    const currentState = this.timerService.currentState;
    if (currentState.isRunning || currentState.isPaused) {
      // Show confirmation modal
      this.showResetConfirmationModal = true;
    } else {
      // No active session, proceed with reset
      this.timerService.resetTimer();
    }
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

  // ===== RESET CONFIRMATION METHODS =====

  /**
   * Hides the reset confirmation modal
   */
  hideResetConfirmation(): void {
    this.showResetConfirmationModal = false;
  }

  /**
   * Confirms the reset operation
   * Stops the current session and then resets the timer
   */
  confirmReset(): void {
    console.log('App: confirmReset called');
    
    // First stop the current session if it's running or paused
    const currentState = this.timerService.currentState;
    if (currentState.isRunning || currentState.isPaused) {
      this.timerService.stopTimer();
    }
    
    // Then reset the timer
    this.timerService.resetTimer();
    
    // Hide the confirmation modal
    this.showResetConfirmationModal = false;
    
    // Show success message
    this.toastService.success('Timer reset successfully');
  }
}
