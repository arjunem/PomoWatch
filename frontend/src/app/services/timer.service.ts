import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { TimerState, Session, PomodoroSettings } from '../models/session.model';

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

  private timerSubscription?: Subscription;
  private workSessionCount = 0;

  // Observable streams
  public timerState$: Observable<TimerState> = this.timerStateSubject.asObservable();
  public settings$: Observable<PomodoroSettings> = this.settingsSubject.asObservable();

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

  constructor() {
    this.loadSettings();
  }

  // Timer Controls
  startWorkSession(): void {
    const settings = this.settingsSubject.value;
    const duration = settings.workDuration * 60;
    
    this.startSession('work', duration);
    this.workSessionCount++;
  }

  startBreakSession(): void {
    const settings = this.settingsSubject.value;
    const isLongBreak = this.workSessionCount >= settings.sessionsUntilLongBreak;
    const duration = isLongBreak ? settings.longBreakDuration : settings.breakDuration;
    
    this.startSession('break', duration * 60);
    
    if (isLongBreak) {
      this.workSessionCount = 0; // Reset counter after long break
    }
  }

  private startSession(type: 'work' | 'break', duration: number): void {
    const newSession: Session = {
      id: 0, // Will be set by backend
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

  pauseTimer(): void {
    if (this.timerStateSubject.value.isRunning) {
      this.updateTimerState({
        isRunning: false,
        isPaused: true
      });
      this.stopTimerInternal();
    }
  }

  resumeTimer(): void {
    if (this.timerStateSubject.value.isPaused) {
      this.updateTimerState({
        isRunning: true,
        isPaused: false
      });
      this.startTimer();
    }
  }

  stopTimer(): void {
    this.updateTimerState({
      isRunning: false,
      isPaused: false,
      remainingTime: 0
    });
    this.stopTimerInternal();
  }

  resetTimer(): void {
    const currentState = this.timerStateSubject.value;
    this.updateTimerState({
      remainingTime: currentState.totalDuration,
      isRunning: false,
      isPaused: false
    });
    this.stopTimerInternal();
  }

  // Timer Logic
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

  private stopTimerInternal(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  private onTimerComplete(): void {
    const currentState = this.timerStateSubject.value;
    
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
    const settings = this.settingsSubject.value;
    if (currentState.sessionType === 'work' && settings.autoStartBreaks) {
      setTimeout(() => this.startBreakSession(), 1000);
    } else if (currentState.sessionType === 'break' && settings.autoStartPomodoros) {
      setTimeout(() => this.startWorkSession(), 1000);
    }
  }

  // Settings Management
  updateSettings(settings: Partial<PomodoroSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('pomodoro-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.settingsSubject.next(settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }

  private saveSettings(settings: PomodoroSettings): void {
    localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
  }

  // Utility Methods
  private updateTimerState(updates: Partial<TimerState>): void {
    const currentState = this.timerStateSubject.value;
    this.timerStateSubject.next({ ...currentState, ...updates });
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

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
}
