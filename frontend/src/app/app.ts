import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TimerService } from './services/timer.service';
import { ApiService } from './services/api.service';
import { Session, TimerState, PomodoroSettings } from './models/session.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Timer state observables
  timerState$: Observable<TimerState>;
  remainingTime$: Observable<string>;
  isRunning$: Observable<boolean>;
  progressPercentage$: Observable<number>;
  currentSession$: Observable<Session | null>;

  // Settings
  settings$: Observable<PomodoroSettings>;

  constructor(
    private timerService: TimerService,
    private apiService: ApiService
  ) {
    this.timerState$ = this.timerService.timerState$;
    this.remainingTime$ = this.timerService.timeDisplay$;
    this.isRunning$ = this.timerService.isRunning$;
    this.progressPercentage$ = this.timerService.progressPercentage$;
    this.currentSession$ = this.timerService.currentSession$;
    this.settings$ = this.timerService.settings$;
  }

  ngOnInit(): void {
    // Check API connectivity on startup
    this.apiService.getHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => console.log('API Health Check:', response),
        error: (error) => console.error('API Connection Error:', error)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Timer Controls
  startWorkSession(): void {
    this.timerService.startWorkSession();
  }

  startBreakSession(): void {
    this.timerService.startBreakSession();
  }

  pauseTimer(): void {
    this.timerService.pauseTimer();
  }

  resumeTimer(): void {
    this.timerService.resumeTimer();
  }

  stopTimer(): void {
    this.timerService.stopTimer();
  }

  resetTimer(): void {
    this.timerService.resetTimer();
  }
}
