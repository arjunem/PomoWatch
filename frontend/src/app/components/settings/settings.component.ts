import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SettingsService, PomodoroSettingsDto } from '../../services/settings.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-card p-6 rounded-2xl">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-ink mb-2">⚙️ Settings</h1>
          <p class="text-ink-soft">Configure your Pomodoro timer preferences</p>
        </div>

        <!-- Settings Form -->
        <div class="bg-page rounded-2xl shadow-lg border border-line p-8">
          <form (ngSubmit)="onSubmit()" #settingsForm="ngForm">

            <!-- Timer Durations Section -->
            <div class="mb-8">
              <h2 class="text-2xl font-semibold text-ink mb-6 flex items-center">
                <span class="text-3xl mr-3">⏱️</span>
                Timer Durations
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Work Duration -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-ink-soft">Work Duration (minutes)</label>
                  <input
                    type="number"
                    name="workDuration"
                    [(ngModel)]="settings.workDuration"
                    min="1"
                    max="120"
                    class="w-full px-4 py-3 bg-card border border-line rounded-lg text-ink focus:ring-2 focus:ring-accent focus:border-transparent"
                    required>
                </div>

                <!-- Break Duration -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-ink-soft">Break Duration (minutes)</label>
                  <input
                    type="number"
                    name="breakDuration"
                    [(ngModel)]="settings.breakDuration"
                    min="1"
                    max="60"
                    class="w-full px-4 py-3 bg-card border border-line rounded-lg text-ink focus:ring-2 focus:ring-accent focus:border-transparent"
                    required>
                </div>

                <!-- Long Break Duration -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-ink-soft">Long Break Duration (minutes)</label>
                  <input
                    type="number"
                    name="longBreakDuration"
                    [(ngModel)]="settings.longBreakDuration"
                    min="1"
                    max="120"
                    class="w-full px-4 py-3 bg-card border border-line rounded-lg text-ink focus:ring-2 focus:ring-accent focus:border-transparent"
                    required>
                </div>
              </div>
            </div>

            <!-- Session Configuration Section -->
            <div class="mb-8">
              <h2 class="text-2xl font-semibold text-ink mb-6 flex items-center">
                <span class="text-3xl mr-3">🎯</span>
                Session Configuration
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Sessions Until Long Break -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-ink-soft">Sessions Until Long Break</label>
                  <input
                    type="number"
                    name="sessionsUntilLongBreak"
                    [(ngModel)]="settings.sessionsUntilLongBreak"
                    min="1"
                    max="20"
                    class="w-full px-4 py-3 bg-card border border-line rounded-lg text-ink focus:ring-2 focus:ring-accent focus:border-transparent"
                    required>
                  <p class="text-xs text-muted">Number of work sessions before a long break</p>
                </div>
              </div>
            </div>

            <!-- Auto-Start Options Section -->
            <div class="mb-8">
              <h2 class="text-2xl font-semibold text-ink mb-6 flex items-center">
                <span class="text-3xl mr-3">🔄</span>
                Auto-Start Options
              </h2>

              <div class="space-y-4">
                <!-- Auto Start Breaks -->
                <div class="flex items-center justify-between gap-4 p-4 bg-card rounded-lg">
                  <div>
                    <label class="text-ink font-medium">Auto-start breaks</label>
                    <p class="text-sm text-muted">Automatically start break timer after work session ends</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      name="autoStartBreaks"
                      [(ngModel)]="settings.autoStartBreaks"
                      class="sr-only peer">
                    <div class="w-11 h-6 bg-track peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                <!-- Auto Start Pomodoros -->
                <div class="flex items-center justify-between gap-4 p-4 bg-card rounded-lg">
                  <div>
                    <label class="text-ink font-medium">Auto-start Pomodoros</label>
                    <p class="text-sm text-muted">Automatically start work timer after break session ends</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      name="autoStartPomodoros"
                      [(ngModel)]="settings.autoStartPomodoros"
                      class="sr-only peer">
                    <div class="w-11 h-6 bg-track peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Sound Options Section -->
            <div class="mb-8">
              <h2 class="text-2xl font-semibold text-ink mb-6 flex items-center">
                <span class="text-3xl mr-3">🔊</span>
                Sound Options
              </h2>

              <div class="flex items-center justify-between gap-4 p-4 bg-card rounded-lg">
                <div>
                  <label class="text-ink font-medium">Enable sound notifications</label>
                  <p class="text-sm text-muted">Play sound when sessions complete</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    name="soundEnabled"
                    [(ngModel)]="settings.soundEnabled"
                    class="sr-only peer">
                  <div class="w-11 h-6 bg-track peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div class="flex items-center justify-between gap-4 p-4 bg-card rounded-lg mt-4">
                <div>
                  <label class="text-ink font-medium">Auto-sync noise with timer</label>
                  <p class="text-sm text-muted">Automatically play noise when a session starts, pause when it stops</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    name="noiseAutoSync"
                    [(ngModel)]="settings.noiseAutoSync"
                    class="sr-only peer">
                  <div class="w-11 h-6 bg-track peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            </div>

            <!-- Offline Mode Section -->
            <div class="mb-8">
              <h2 class="text-2xl font-semibold text-ink mb-6 flex items-center">
                <span class="text-3xl mr-3">📱</span>
                Offline Mode
              </h2>

              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4 p-4 bg-card rounded-lg">
                  <div class="flex-1">
                    <h3 class="text-lg font-medium text-ink mb-2">Enable Offline Mode</h3>
                    <p class="text-sm text-muted">Run the app completely in browser without backend connection</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      name="offlineMode"
                      [(ngModel)]="settings.offlineMode"
                      class="sr-only peer">
                    <div class="w-11 h-6 bg-track peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                (click)="cancelSettings()"
                [disabled]="isLoading"
                class="px-6 py-3 bg-card hover:bg-disabled-bg text-ink-soft border border-line font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>

              <button
                type="button"
                (click)="resetToDefaults()"
                [disabled]="isLoading"
                class="px-6 py-3 border-2 border-danger text-danger bg-transparent hover:bg-danger-bg font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="!isLoading">Reset to Defaults</span>
                <span *ngIf="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              </button>

              <button
                type="submit"
                [disabled]="!settingsForm.valid || isLoading"
                class="px-8 py-3 bg-accent hover:opacity-90 text-accent-ink font-semibold rounded-lg transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="!isLoading">Save Settings</span>
                <span *ngIf="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              </button>
            </div>
          </form>
        </div>

        <!-- Success/Error Messages -->
        <div *ngIf="message" class="mt-6 p-4 rounded-lg" [ngClass]="messageType === 'success' ? 'bg-green-900 border border-green-600 text-green-200' : 'bg-red-900 border border-red-600 text-red-200'">
          {{ message }}
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Output() settingsSaved = new EventEmitter<void>();
  @Output() settingsCancelled = new EventEmitter<void>();

  settings: PomodoroSettingsDto = {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    offlineMode: false,
    noiseType: 'none',
    noiseVolume: 0.5,
    noiseAutoSync: true
  };

  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private timerService: TimerService
  ) {}

  ngOnInit(): void {
    // Subscribe to settings changes from the service
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          console.log('SettingsComponent: Received settings update:', settings);
          this.settings = { ...settings };
        },
        error: (error) => {
          console.error('SettingsComponent: Failed to receive settings:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  /**
   * Handles form submission to save settings
   */
  onSubmit(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.settingsService.updateSettings(this.settings)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedSettings) => {
          this.settings = { ...updatedSettings };
          this.showMessage('Settings saved successfully!', 'success');
          this.isLoading = false;
          
          // Stop current timer and refresh when settings are saved
          this.timerService.stopTimer();
          
          // Emit event to close modal after successful save
          setTimeout(() => {
            this.settingsSaved.emit();
          }, 1500); // Close after 1.5 seconds to show success message
        },
        error: (error) => {
          console.error('Failed to save settings:', error);
          this.showMessage('Failed to save settings. Please try again.', 'error');
          this.isLoading = false;
        }
      });
  }

  /**
   * Resets settings to default values
   */
  resetToDefaults(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.settingsService.resetToDefaults()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (defaultSettings) => {
          this.settings = { ...defaultSettings };
          this.showMessage('Settings reset to defaults!', 'success');
          this.isLoading = false;
          
          // Stop current timer and refresh when settings are reset
          this.timerService.stopTimer();
        },
        error: (error) => {
          console.error('Failed to reset settings:', error);
          this.showMessage('Failed to reset settings. Please try again.', 'error');
          this.isLoading = false;
        }
      });
  }

  /**
   * Handles cancel button click
   */
  cancelSettings(): void {
    this.settingsCancelled.emit();
  }

  /**
   * Shows a message to the user
   */
  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
