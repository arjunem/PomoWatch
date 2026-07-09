import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ApiService, SessionStatsService } from '../../services/api.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-today-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Today's Stats - Always visible section -->
    <div *ngIf="todayStats$ | async as stats" class="bg-card border border-line rounded-xl shadow-lg p-6 mt-6">
      <h2 class="text-xl font-semibold text-ink mb-4">Today's Progress</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-3 bg-tile rounded-lg">
          <div class="text-2xl font-bold text-accent">{{ stats.totalWorkTime }}</div>
          <div class="text-sm text-muted">Work Minutes</div>
        </div>
        <div class="text-center p-3 bg-tile rounded-lg">
          <div class="text-2xl font-bold text-accent">{{ stats.totalBreakTime }}</div>
          <div class="text-sm text-muted">Break Minutes</div>
        </div>
        <div class="text-center p-3 bg-tile rounded-lg">
          <div class="text-2xl font-bold text-accent">{{ stats.completedSessions }}</div>
          <div class="text-sm text-muted">Completed</div>
        </div>
        <div class="text-center p-3 bg-tile rounded-lg">
          <div class="text-2xl font-bold text-accent">{{ stats.totalSessions }}</div>
          <div class="text-sm text-muted">Total Sessions</div>
        </div>
      </div>
    </div>
  `
})
export class TodayProgressComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  todayStats$: Observable<any>;

  constructor(
    private statsService: SessionStatsService,
    private timerService: TimerService,
    private cdr: ChangeDetectorRef
  ) {
    this.todayStats$ = this.statsService.getTodayStats();
  }

  ngOnInit(): void {
    // Listen for session changes and refresh the statistics
    this.timerService.sessionChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('TodayProgressComponent: Received session change notification');
        this.refreshStatistics();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Refreshes the statistics display
   * Called after session operations to ensure real-time updates
   */
  private refreshStatistics(): void {
    console.log('TodayProgressComponent: Refreshing statistics');
    this.statsService.getTodayStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.todayStats$ = new Observable(observer => {
            observer.next(stats);
            observer.complete();
          });
          // Trigger change detection to update the UI
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to refresh statistics:', error);
        }
      });
  }
}
