import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PomodoroSettingsDto {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
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
    soundEnabled: true
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('SettingsService: Constructor called');
    // Load settings immediately when service is constructed
    this.loadSettings();
  }

  /**
   * Gets the current settings from the backend
   */
  getSettings(): Observable<PomodoroSettingsDto> {
    return this.http.get<PomodoroSettingsDto>(this.baseUrl)
      .pipe(
        tap(settings => {
          this.settingsSubject.next(settings);
        })
      );
  }

  /**
   * Updates settings on the backend
   */
  updateSettings(settings: PomodoroSettingsDto): Observable<PomodoroSettingsDto> {
    return this.http.put<PomodoroSettingsDto>(this.baseUrl, settings)
      .pipe(
        tap(updatedSettings => {
          this.settingsSubject.next(updatedSettings);
        })
      );
  }

  /**
   * Resets settings to default values
   */
  resetToDefaults(): Observable<PomodoroSettingsDto> {
    return this.http.post<PomodoroSettingsDto>(`${this.baseUrl}/reset`, {})
      .pipe(
        tap(defaultSettings => {
          this.settingsSubject.next(defaultSettings);
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
