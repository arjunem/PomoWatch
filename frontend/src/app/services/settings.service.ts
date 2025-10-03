import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { OfflineService } from './offline.service';

export interface PomodoroSettingsDto {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  offlineMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly baseUrl = `${environment.apiBaseUrl}/settings`;
  private settingsSubject = new BehaviorSubject<PomodoroSettingsDto>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    offlineMode: false
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient, private offlineService: OfflineService) {
    console.log('SettingsService: Constructor called');
    // Load settings immediately when service is constructed
    this.loadSettings();
  }

  /**
   * Gets the current settings from the backend
   */
  getSettings(): Observable<PomodoroSettingsDto> {
    // Check if we're in offline mode - skip API call entirely
    if (this.offlineService.isOffline) {
      console.log('SettingsService: Getting settings in offline mode');
      const defaultSettings: PomodoroSettingsDto = {
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        soundEnabled: true,
        offlineMode: true
      };
      this.settingsSubject.next(defaultSettings);
      return of(defaultSettings);
    }
    
    return this.http.get<PomodoroSettingsDto>(this.baseUrl)
      .pipe(
        tap(settings => {
          this.settingsSubject.next(settings);
        }),
        catchError(error => {
          console.error('Failed to load settings from backend:', error);
          console.log('Switching to offline mode due to settings API failure');
          this.offlineService.setOfflineMode(true);
          // Return default settings
          const defaultSettings: PomodoroSettingsDto = {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            soundEnabled: true,
            offlineMode: true
          };
          this.settingsSubject.next(defaultSettings);
          return [defaultSettings];
        })
      );
  }

  /**
   * Updates settings on the backend
   */
  updateSettings(settings: PomodoroSettingsDto): Observable<PomodoroSettingsDto> {
    // Check if we're in offline mode - skip API call entirely
    if (this.offlineService.isOffline) {
      console.log('SettingsService: Updating settings in offline mode');
      this.settingsSubject.next(settings);
      return of(settings);
    }
    
    return this.http.put<PomodoroSettingsDto>(this.baseUrl, settings)
      .pipe(
        tap(updatedSettings => {
          this.settingsSubject.next(updatedSettings);
        }),
        catchError(error => {
          console.error('Failed to update settings in backend:', error);
          console.log('Switching to offline mode due to settings API failure');
          this.offlineService.setOfflineMode(true);
          // Update local settings anyway
          this.settingsSubject.next(settings);
          return [settings];
        })
      );
  }

  /**
   * Resets settings to default values
   */
  resetToDefaults(): Observable<PomodoroSettingsDto> {
    // Check if we're in offline mode - skip API call entirely
    if (this.offlineService.isOffline) {
      console.log('SettingsService: Resetting settings in offline mode');
      const defaultSettings: PomodoroSettingsDto = {
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        soundEnabled: true,
        offlineMode: true
      };
      this.settingsSubject.next(defaultSettings);
      return of(defaultSettings);
    }
    
    return this.http.post<PomodoroSettingsDto>(`${this.baseUrl}/reset`, {})
      .pipe(
        tap(defaultSettings => {
          this.settingsSubject.next(defaultSettings);
        }),
        catchError(error => {
          console.error('Failed to reset settings in backend:', error);
          console.log('Switching to offline mode due to settings API failure');
          this.offlineService.setOfflineMode(true);
          // Return default settings locally
          const defaultSettings: PomodoroSettingsDto = {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            soundEnabled: true,
            offlineMode: true
          };
          this.settingsSubject.next(defaultSettings);
          return [defaultSettings];
        })
      );
  }

  /**
   * Gets a specific setting value by key
   */
  getSettingValue(key: string): Observable<string> {
    return this.http.get<string>(`${this.baseUrl}/${key}`);
  }

  /**
   * Loads settings from backend on service initialization
   */
  private loadSettings(): void {
    console.log('SettingsService: Starting to load settings...');
    this.getSettings().subscribe({
      next: (settings) => {
        console.log('SettingsService: Settings loaded successfully:', settings);
      },
      error: (error) => {
        console.error('SettingsService: Failed to load settings:', error);
        console.log('Switching to offline mode due to settings load failure');
        this.offlineService.setOfflineMode(true);
        // Keep default settings if loading fails
      }
    });
  }

  /**
   * Gets current settings value synchronously
   */
  get currentSettings(): PomodoroSettingsDto {
    return this.settingsSubject.value;
  }
}
