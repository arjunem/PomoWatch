import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Session, TimerState } from '../../models/session.model';
import { ApiService, SessionStatsService } from '../../services/api.service';
import { TimerService } from '../../services/timer.service';
import { parseUtcDate, formatLocalDate } from '../../utils/date.utils';

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Current Session Info - Separate section above Session History -->
    <div *ngIf="currentSession$ | async as session" class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-blue-800 mb-4">Current Session</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div class="flex items-center min-w-0">
          <span class="text-gray-600 whitespace-nowrap">Type:</span>
          <span class="font-semibold capitalize ml-1 truncate">{{ session.type }}</span>
        </div>
        <div class="flex items-center min-w-0">
          <span class="text-gray-600 whitespace-nowrap">Status:</span>
          <span class="font-semibold capitalize ml-1 truncate">{{ session.status }}</span>
        </div>
        <div class="flex items-center min-w-0">
          <span class="text-gray-600 whitespace-nowrap">Duration:</span>
          <span class="font-semibold ml-1 truncate">{{ session.durationMinutes }} min</span>
        </div>
        <div class="flex items-center min-w-0">
          <span class="text-gray-600 whitespace-nowrap">Started:</span>
          <span class="font-semibold ml-1 truncate">{{ formatCompactTime(session.startTime) }}</span>
        </div>
      </div>
    </div>

    <!-- Session History Section -->
    <div class="bg-white rounded-xl shadow-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">Session History</h2>
        <div class="flex items-center space-x-3">
          <!-- Clear All Sessions Button -->
          <button
            *ngIf="!isCollapsed && recentSessions.length > 0"
            (click)="clearAllSessions()"
            [disabled]="isClearing"
            class="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors duration-200">
            <span>🗑️</span>
            <span>{{ isClearing ? 'Clearing...' : 'Clear All' }}</span>
          </button>

          <!-- Toggle Button -->
          <button
            (click)="toggleCollapse()"
            class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200">
            <span>{{ isCollapsed ? 'Show' : 'Hide' }}</span>
            <span class="transform transition-transform duration-200" 
                  [class.rotate-180]="!isCollapsed">▼</span>
          </button>
        </div>
      </div>

      <!-- Collapsible Content -->
      <div class="overflow-hidden transition-all duration-300 ease-in-out"
           [class.max-h-0]="isCollapsed"
           [class.max-h-screen]="!isCollapsed">
        <div class="space-y-4">
          <!-- Recent Sessions -->
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-800 mb-3">Recent Sessions</h3>
        <div *ngIf="recentSessions.length === 0" class="text-gray-500 text-center py-8">
          No sessions yet. Start your first Pomodoro session!
        </div>
        <div *ngFor="let session of recentSessions" class="border border-gray-200 rounded-lg p-4 mb-3">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">{{ session.type === 'work' ? '🎯' : '☕' }}</span>
                <span class="font-semibold capitalize">{{ session.type }} Session</span>
                <span class="px-2 py-1 text-xs rounded-full" 
                      [class]="getStatusClass(session.status)">
                  {{ session.status }}
                </span>
              </div>
              <div class="text-sm text-gray-600">
                <span>Duration: {{ session.durationMinutes }} min</span>
                <span class="mx-2">•</span>
                <span>Started: {{ formatTime(session.startTime) }}</span>
                <span *ngIf="session.endTime" class="mx-2">•</span>
                <span *ngIf="session.endTime">Ended: {{ formatTime(session.endTime) }}</span>
              </div>
            </div>
            <button 
              (click)="openDeleteModal(session)"
              class="flex items-center space-x-1 text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-lg hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="deletingSessionId === session.id"
              title="Delete session">
              <span>🗑️</span>
              <span class="hidden sm:inline">{{ deletingSessionId === session.id ? 'Deleting...' : 'Delete' }}</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      <!-- Today's Stats - Separate section below Session History -->
      <div *ngIf="todayStats$ | async as stats" class="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Today's Progress</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ stats.totalWorkTime }}</div>
            <div class="text-sm text-gray-600">Work Minutes</div>
          </div>
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ stats.totalBreakTime }}</div>
            <div class="text-sm text-gray-600">Break Minutes</div>
          </div>
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{{ stats.completedSessions }}</div>
            <div class="text-sm text-gray-600">Completed</div>
          </div>
          <div class="text-center p-3 bg-orange-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">{{ stats.totalSessions }}</div>
            <div class="text-sm text-gray-600">Total Sessions</div>
          </div>
      </div>
    </div>

    <!-- Beautiful Metallic Delete Confirmation Modal -->
    <div *ngIf="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="closeDeleteModal()">
      <div class="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-600 p-8 max-w-md mx-4 transform transition-all duration-300 scale-100" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">Delete Session</h3>
          <p class="text-gray-300">This action cannot be undone</p>
        </div>

        <!-- Session Details -->
        <div *ngIf="sessionToDelete" class="bg-gray-700 rounded-xl p-4 mb-6 border border-gray-600">
          <div class="flex items-center space-x-3 mb-3">
            <span class="text-2xl">{{ sessionToDelete.type === 'work' ? '🎯' : '☕' }}</span>
            <div>
              <h4 class="text-lg font-semibold text-white capitalize">{{ sessionToDelete.type }} Session</h4>
              <p class="text-gray-300 text-sm">{{ formatTime(sessionToDelete.startTime) }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-gray-300">
              <span class="text-gray-400">Duration:</span>
              <span class="text-white font-medium ml-2">{{ sessionToDelete.durationMinutes }} min</span>
            </div>
            <div class="text-gray-300">
              <span class="text-gray-400">Status:</span>
              <span class="text-white font-medium ml-2 capitalize">{{ sessionToDelete.status }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button
            (click)="closeDeleteModal()"
            class="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Cancel
          </button>
          <button
            (click)="confirmDelete()"
            [disabled]="deletingSessionId !== null"
            class="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            <span *ngIf="deletingSessionId === null">Delete Forever</span>
            <span *ngIf="deletingSessionId !== null" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            </span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class SessionHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  recentSessions: Session[] = [];
  currentSession$: Observable<Session | null>;
  todayStats$: Observable<any>;
  isDeleting = false;
  isClearing = false;
  isCollapsed = true; // Start collapsed by default
  
  // Individual session deletion states
  deletingSessionId: number | null = null;
  showDeleteModal = false;
  sessionToDelete: Session | null = null;

  constructor(
    private apiService: ApiService,
    private statsService: SessionStatsService,
    private timerService: TimerService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentSession$ = this.timerService.currentSession$;
    this.todayStats$ = this.statsService.getTodayStats();
  }

  ngOnInit(): void {
    this.loadRecentSessions();
    
    // Listen for session changes and refresh the list
    this.timerService.sessionChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('SessionHistoryComponent: Received session change notification');
        // Add a small delay to ensure backend operations complete
        setTimeout(() => {
          this.loadRecentSessions();
        }, 100);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads the most recent sessions from the backend
   * Displays up to 10 recent sessions for quick reference
   */
  private loadRecentSessions(): void {
    console.log('SessionHistoryComponent: Loading recent sessions');
    this.apiService.getAllSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions) => {
          console.log('SessionHistoryComponent: Received sessions:', sessions.length);
          // Sort by creation date (newest first) and take the first 10
          this.recentSessions = sessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
        },
        error: (error) => {
          console.error('Failed to load recent sessions:', error);
        }
      });
    
    // Also refresh today's stats when sessions change
    this.refreshStatistics();
  }

  /**
   * Opens the beautiful delete confirmation modal
   * Shows session details and asks for confirmation
   */
  openDeleteModal(session: Session): void {
    this.sessionToDelete = session;
    this.showDeleteModal = true;
  }

  /**
   * Closes the delete confirmation modal
   * Resets the modal state
   */
  closeDeleteModal(): void {
    // Only allow closing if not currently deleting
    if (this.deletingSessionId === null) {
      this.showDeleteModal = false;
      this.sessionToDelete = null;
    }
  }

  /**
   * Confirms and executes the session deletion
   * Uses the beautiful modal for confirmation
   */
  confirmDelete(): void {
    if (!this.sessionToDelete || this.deletingSessionId !== null) return;
    
    this.deletingSessionId = this.sessionToDelete.id;
    
    this.apiService.deleteSession(this.sessionToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const deletedSessionId = this.sessionToDelete!.id;
          console.log(`Session ${deletedSessionId} deleted successfully`);
          
          // Remove the deleted session from the local array immediately for better UX
          this.recentSessions = this.recentSessions.filter(session => session.id !== deletedSessionId);
          
          // Close modal and reset state
          this.showDeleteModal = false;
          this.sessionToDelete = null;
          this.deletingSessionId = null;
          
          // Trigger change detection to update the UI
          this.cdr.detectChanges();
          
          // Refresh the entire session list to ensure consistency
          this.loadRecentSessions();
          
          // Refresh statistics after deletion
          this.refreshStatistics();
        },
        error: (error) => {
          console.error('Failed to delete session:', error);
          alert('Failed to delete session. Please try again.');
          this.deletingSessionId = null;
        }
      });
  }

  /**
   * Formats a timestamp string for display
   * Shows date and time in a readable format
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Formats a timestamp string for compact display in Current Session
   * Shows shorter format to prevent wrapping
   */
  formatCompactTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      // Show only time if it's today
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Show date and time for other days
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }

  /**
   * Returns CSS classes for session status badges
   * Provides visual distinction between different statuses
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Formats a date string for display in local timezone
   * Handles UTC dates from the backend properly
   */
  formatDate(dateString: string): string {
    try {
      const date = parseUtcDate(dateString);
      return formatLocalDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Fallback to original string
    }
  }

  /**
   * Toggles the collapsed state of the session list
   */
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  /**
   * Clears all sessions with confirmation dialog
   * Uses soft delete to maintain data integrity
   */
  clearAllSessions(): void {
    if (this.isClearing) return;

    const confirmationMessage = `Are you sure you want to clear all ${this.recentSessions.length} sessions?\n\nThis action cannot be undone, but sessions will be recoverable from the database if needed.`;
    
    if (confirm(confirmationMessage)) {
      this.isClearing = true;
      
      this.apiService.clearAllSessions()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('All sessions cleared:', response);
            // Clear local sessions list
            this.recentSessions = [];
            // Refresh the session list to show empty state
            this.loadRecentSessions();
            // Refresh statistics after clearing all
            this.refreshStatistics();
            this.isClearing = false;
          },
          error: (error) => {
            console.error('Failed to clear sessions:', error);
            this.isClearing = false;
            alert('Failed to clear sessions. Please try again.');
          }
        });
    }
  }

  /**
   * Refreshes the statistics display
   * Called after session operations to ensure real-time updates
   */
  private refreshStatistics(): void {
    console.log('SessionHistoryComponent: Refreshing statistics');
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
