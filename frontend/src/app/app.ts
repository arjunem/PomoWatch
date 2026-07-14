import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Observable, Subject, interval, of, timer, takeUntil } from 'rxjs';
import { switchMap, catchError, retry, map } from 'rxjs/operators';
import { TimerService } from './services/timer.service';
import { ApiService } from './services/api.service';
import { SettingsService } from './services/settings.service';
import { OfflineService } from './services/offline.service';
import { ToastService } from './services/toast.service';
import { NoiseService, NoiseRepeatMode, LofiProgress } from './services/noise.service';
import { Track } from './config/lofi-tracks';
import { Session, TimerState, PomodoroSettings, NoiseType } from './models/session.model';
import { SessionHistoryComponent } from './components/session-history/session-history.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TodayProgressComponent } from './components/today-progress/today-progress.component';
import { ToastComponent } from './components/toast/toast.component';
import { ThemeSelectorComponent } from './components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, SessionHistoryComponent, TodayProgressComponent, SettingsComponent, ToastComponent, ThemeSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private static readonly KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;
  // Render's free tier can take up to ~60s to wake a sleeping backend; retry
  // the startup health check across that window instead of failing on the first hit
  private static readonly COLD_START_RETRY_COUNT = 6;
  private static readonly COLD_START_RETRY_DELAY_MS = 10 * 1000;

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

  // Background noise state
  noiseType: NoiseType = 'none';
  noiseVolume = 0.5;
  noisePlaying$: Observable<boolean>;
  noiseRepeatMode$: Observable<NoiseRepeatMode>;
  lofiTrackIndex$: Observable<number>;
  lofiTracks: readonly Track[];
  hasLofiTracks: boolean;
  lofiProgress$: Observable<LofiProgress>;
  isSeekingLofi = false;
  seekPreviewValue = 0;
  private settingsNoiseType: NoiseType = 'none';
  private wasLofiAvailable = true;

  // Settings modal state
  showSettingsModal = false;
  
  // Reset confirmation modal state
  showResetConfirmationModal = false;
  
  // Stop confirmation modal state
  showStopConfirmationModal = false;

  constructor(
    private timerService: TimerService,
    private apiService: ApiService,
    private settingsService: SettingsService,
    private offlineService: OfflineService,
    private toastService: ToastService,
    private noiseService: NoiseService,
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
    this.noisePlaying$ = this.noiseService.playing$;
    this.noiseRepeatMode$ = this.noiseService.repeatMode$;
    this.lofiTrackIndex$ = this.noiseService.lofiTrackIndex$;
    this.lofiTracks = this.noiseService.lofiTracks;
    this.hasLofiTracks = this.noiseService.hasLofiTracks;
    this.lofiProgress$ = this.noiseService.lofiProgress$;
    this.wasLofiAvailable = this.hasLofiTracks && !this.isOffline;

    // Subscribe to offline state changes to update local state
    this.isOffline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOffline => {
        console.log('App: Offline state changed to:', isOffline);
        this.isOffline = isOffline;
        this.reconcileNoiseType();
        // Force change detection to update the UI
        this.cdr.detectChanges();
      });

    // Mirror noise preferences from settings into local state and the noise engine
    this.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settingsNoiseType = settings.noiseType;
        this.noiseVolume = settings.noiseVolume;
        this.reconcileNoiseType();
        this.noiseService.setVolume(this.noiseVolume);
      });
  }

  /**
   * Reconciles the effective (locally displayed) noise type against the
   * persisted setting, given whether Lo-fi is currently usable (URLs
   * configured and online - YouTube playback needs network). Falls back to
   * 'none' without overwriting the persisted choice, so the original
   * selection re-activates automatically once Lo-fi becomes usable again.
   */
  private reconcileNoiseType(): void {
    const lofiAvailable = this.hasLofiTracks && !this.isOffline;

    if (this.settingsNoiseType === 'lofi' && !lofiAvailable) {
      this.noiseType = 'none';
      if (this.wasLofiAvailable) {
        const reason = this.isOffline ? 'you are offline' : 'no track URLs are configured';
        this.toastService.info(`Tracks are unavailable (${reason}) — switched to None.`);
      }
    } else {
      this.noiseType = this.settingsNoiseType;
    }

    this.wasLofiAvailable = lofiAvailable;
    this.noiseService.setType(this.noiseType);
  }

  /**
   * Component initialization lifecycle hook
   * Performs API health check to verify backend connectivity
   */
  ngOnInit(): void {
    // Check API connectivity on startup and switch to offline mode if unavailable.
    // Retries with a delay to tolerate the backend waking up from a cold start.
    this.apiService.getHealth()
      .pipe(
        retry({ count: App.COLD_START_RETRY_COUNT, delay: () => timer(App.COLD_START_RETRY_DELAY_MS) }),
        takeUntil(this.destroy$)
      )
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

    // Keep the free-tier backend warm while this tab is open, so it doesn't
    // spin down from inactivity (Render sleeps the API after 15 idle minutes).
    // Also self-heals offline mode: flips back online once a ping succeeds,
    // without waiting for a manual toggle. A failed ping does NOT force offline
    // mode here — that would fight a deliberate manual "go offline" choice and
    // over-react to a single transient blip; the startup check already handles
    // the real cold-start case with retries.
    interval(App.KEEP_ALIVE_INTERVAL_MS)
      .pipe(
        switchMap(() => this.apiService.getHealth().pipe(
          map(() => true),
          catchError(() => of(false))
        )),
        takeUntil(this.destroy$)
      )
      .subscribe(isHealthy => {
        // Don't override a deliberate manual "go offline" choice (persisted in
        // settings) - only auto-heal state that was set by connectivity failure
        if (isHealthy && !this.settingsService.currentSettings.offlineMode) {
          this.offlineService.setOfflineMode(false);
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
    this.noiseService.stop();
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
   * Shows confirmation dialog if there's a running session
   */
  stopTimer(): void {
    console.log('App: stopTimer called');
    
    // Check if there's a running session
    const currentState = this.timerService.currentState;
    if (currentState.isRunning) {
      // Show confirmation modal
      this.showStopConfirmationModal = true;
    } else {
      // No running session, proceed with stop
      this.timerService.stopTimer();
    }
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

  // ===== BACKGROUND NOISE METHODS =====

  /**
   * Changes the selected noise type, applies it to the noise engine,
   * and persists the choice via SettingsService
   */
  onNoiseTypeChange(value: NoiseType): void {
    this.noiseType = value;
    this.noiseService.setType(value);
    const updatedSettings = { ...this.settingsService.currentSettings, noiseType: value };
    this.settingsService.updateSettings(updatedSettings).subscribe({
      error: (error) => console.error('Failed to persist noise type:', error)
    });
  }

  /**
   * Changes the noise volume, applies it live, and persists via SettingsService
   */
  onNoiseVolumeChange(event: Event): void {
    const volume = (event.target as HTMLInputElement).valueAsNumber;
    this.noiseVolume = volume;
    this.noiseService.setVolume(volume);
    const updatedSettings = { ...this.settingsService.currentSettings, noiseVolume: volume };
    this.settingsService.updateSettings(updatedSettings).subscribe({
      error: (error) => console.error('Failed to persist noise volume:', error)
    });
  }

  /**
   * Toggles noise play/pause via the manual quick-access control
   */
  toggleNoisePlayback(): void {
    this.noiseService.toggle();
  }

  /**
   * Toggles Lo-fi repeat mode between repeating the current video and
   * advancing through the configured URL list
   */
  toggleNoiseRepeatMode(): void {
    this.noiseService.toggleRepeatMode();
  }

  /**
   * Manually selects a specific Lo-fi track from the configured URL list
   */
  onLofiTrackChange(index: number): void {
    this.noiseService.selectLofiTrack(index);
  }

  /**
   * Tracks the seek bar's live drag position without committing a seek yet,
   * so the polled playback position doesn't fight the user's drag
   */
  onLofiSeekInput(event: Event): void {
    this.seekPreviewValue = (event.target as HTMLInputElement).valueAsNumber;
  }

  /**
   * Commits the seek once the user releases the seek bar
   */
  onLofiSeekCommit(event: Event): void {
    const seconds = (event.target as HTMLInputElement).valueAsNumber;
    this.noiseService.seekTo(seconds);
    this.isSeekingLofi = false;
  }

  /**
   * Formats a seconds value as M:SS for the Lo-fi seek bar labels
   */
  formatSeekTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  // ===== STOP CONFIRMATION METHODS =====

  /**
   * Hides the stop confirmation modal
   */
  hideStopConfirmation(): void {
    this.showStopConfirmationModal = false;
  }

  /**
   * Confirms the stop operation
   * Stops the current session
   */
  confirmStop(): void {
    console.log('App: confirmStop called');
    
    // Stop the current session
    this.timerService.stopTimer();
    
    // Hide the confirmation modal
    this.showStopConfirmationModal = false;
    
    // Show success message
    this.toastService.success('Session stopped successfully');
  }
}
