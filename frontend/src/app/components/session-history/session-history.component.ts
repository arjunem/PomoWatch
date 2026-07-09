import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Session, TimerState } from '../../models/session.model';
import { ApiService } from '../../services/api.service';
import { TimerService } from '../../services/timer.service';
import { parseUtcDate, formatLocalDate } from '../../utils/date.utils';

@Component({
  selector: 'app-session-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Current Session Info - Separate section above Session History -->
    <div *ngIf="currentSession$ | async as session" class="bg-card border border-line rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-accent mb-4">Current Session</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div class="flex items-center min-w-0">
          <span class="text-ink-soft whitespace-nowrap">Type:</span>
          <span class="font-semibold capitalize ml-1 truncate text-ink">{{ session.type }}</span>
        </div>
        <div class="flex items-center min-w-0">
          <span class="text-ink-soft whitespace-nowrap">Status:</span>
          <span class="font-semibold capitalize ml-1 truncate text-ink">{{ session.status }}</span>
        </div>
        <div class="flex items-center min-w-0">
          <span class="text-ink-soft whitespace-nowrap">Duration:</span>
          <span class="font-semibold ml-1 truncate text-ink">{{ session.durationMinutes }} min</span>
        </div>
        <div class="flex items-center min-w-0">
          <span class="text-ink-soft whitespace-nowrap">Started:</span>
          <span class="font-semibold ml-1 truncate text-ink">{{ formatCompactTime(session.startTime) }}</span>
        </div>
      </div>
    </div>

    <!-- Session History Section -->
    <div class="bg-card border border-line rounded-xl shadow-lg p-6">
      <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 class="text-xl font-semibold text-ink">Session History</h2>
        <div class="flex items-center space-x-3">
          <!-- Clear All Sessions Button -->
          <button
            *ngIf="!isCollapsed && recentSessions.length > 0"
            (click)="openClearAllModal()"
            [disabled]="isClearing"
            class="flex items-center space-x-1 px-3 py-1 text-sm text-danger hover:bg-danger-bg disabled:text-disabled disabled:hover:bg-transparent rounded-lg transition-colors duration-200">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            <span>{{ isClearing ? 'Clearing...' : 'Clear All' }}</span>
          </button>

          <!-- Toggle Button -->
          <button
            (click)="toggleCollapse()"
            class="flex items-center space-x-2 text-accent hover:opacity-80 transition-opacity duration-200">
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
        <h3 class="text-lg font-medium text-ink mb-3">Recent Sessions</h3>
        <div *ngIf="recentSessions.length === 0" class="text-ink-soft text-center py-8">
          No sessions yet. Start your first Pomodoro session!
        </div>
        <div *ngFor="let session of recentSessions" class="border border-line rounded-lg p-4 mb-3">
          <div class="flex flex-wrap justify-between items-start gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-2">
                <svg *ngIf="session.type === 'work'" class="w-4 h-4 flex-shrink-0 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.25" fill="currentColor" stroke="none"/></svg>
                <svg *ngIf="session.type !== 'work'" class="w-4 h-4 flex-shrink-0 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.5h8v5.5a3 3 0 01-3 3h-2a3 3 0 01-3-3v-5.5z"/><path d="M10.5 4.5h1a1.7 1.7 0 010 3.4h-1"/></svg>
                <span class="font-semibold capitalize text-ink">{{ session.type }} Session</span>
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="getStatusClass(session.status)">
                  {{ session.status }}
                </span>
              </div>
              <div class="text-sm text-muted">
                <span>Duration: {{ session.durationMinutes }} min</span>
                <span class="mx-2">•</span>
                <span>Started: {{ formatTime(session.startTime) }}</span>
                <span *ngIf="session.endTime" class="mx-2">•</span>
                <span *ngIf="session.endTime">Ended: {{ formatTime(session.endTime) }}</span>
              </div>
            </div>
            <button
              (click)="openDeleteModal(session)"
              class="flex items-center space-x-1 text-danger hover:opacity-80 text-sm px-3 py-1 rounded-lg hover:bg-danger-bg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="deletingSessionId === session.id"
              title="Delete session">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              <span class="hidden sm:inline">{{ deletingSessionId === session.id ? 'Deleting...' : 'Delete' }}</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="closeDeleteModal()">
      <div class="bg-card border border-line rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-danger-bg rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-ink mb-2">Delete Session</h3>
          <p class="text-ink-soft">This action cannot be undone</p>
        </div>

        <!-- Session Details -->
        <div *ngIf="sessionToDelete" class="bg-page rounded-xl p-4 mb-6 border border-line">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-9 h-9 flex-shrink-0 rounded-full bg-card border border-line flex items-center justify-center">
              <svg *ngIf="sessionToDelete.type === 'work'" class="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.25" fill="currentColor" stroke="none"/></svg>
              <svg *ngIf="sessionToDelete.type !== 'work'" class="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.5h8v5.5a3 3 0 01-3 3h-2a3 3 0 01-3-3v-5.5z"/><path d="M10.5 4.5h1a1.7 1.7 0 010 3.4h-1"/></svg>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-ink capitalize">{{ sessionToDelete.type }} Session</h4>
              <p class="text-ink-soft text-sm">{{ formatTime(sessionToDelete.startTime) }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-ink-soft">
              <span class="text-muted">Duration:</span>
              <span class="text-ink font-medium ml-2">{{ sessionToDelete.durationMinutes }} min</span>
            </div>
            <div class="text-ink-soft">
              <span class="text-muted">Status:</span>
              <span class="text-ink font-medium ml-2 capitalize">{{ sessionToDelete.status }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button
            (click)="closeDeleteModal()"
            class="flex-1 bg-page hover:bg-disabled-bg text-ink-soft border border-line font-semibold py-3 px-6 rounded-xl transition-colors duration-200">
            Cancel
          </button>
          <button
            (click)="confirmDelete()"
            [disabled]="deletingSessionId !== null"
            class="flex-1 bg-danger hover:opacity-90 text-accent-ink font-semibold py-3 px-6 rounded-xl transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <span *ngIf="deletingSessionId === null">Delete Forever</span>
            <span *ngIf="deletingSessionId !== null" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Clear All Confirmation Modal -->
    <div *ngIf="showClearAllModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="closeClearAllModal()">
      <div class="bg-card border border-line rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 bg-danger-bg rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-ink mb-2">Clear All Sessions</h3>
          <p class="text-ink-soft">This will delete all completed sessions</p>
        </div>

        <!-- Session Details -->
        <div class="bg-page rounded-xl p-4 mb-6 border border-line">
          <div class="flex items-center space-x-3 mb-3">
            <span class="text-2xl">📊</span>
            <div>
              <h4 class="text-lg font-semibold text-ink">Session History</h4>
              <p class="text-ink-soft text-sm">{{ recentSessions.length }} sessions will be cleared</p>
            </div>
          </div>
          <div class="text-sm text-ink-soft">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-green-500">✓</span>
              <span>Current running session will be preserved</span>
            </div>
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-yellow-500">⚠</span>
              <span>Completed and cancelled sessions will be deleted</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-accent">ℹ</span>
              <span>Sessions are recoverable from database</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4">
          <button
            (click)="closeClearAllModal()"
            class="flex-1 bg-page hover:bg-disabled-bg text-ink-soft border border-line font-semibold py-3 px-6 rounded-xl transition-colors duration-200">
            Cancel
          </button>
          <button
            (click)="confirmClearAll()"
            [disabled]="isClearing"
            class="flex-1 bg-danger hover:opacity-90 text-accent-ink font-semibold py-3 px-6 rounded-xl transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <span *ngIf="!isClearing">Clear All Sessions</span>
            <span *ngIf="isClearing" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Clearing...
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
  isDeleting = false;
  isClearing = false;
  isCollapsed = true; // Start collapsed by default
  
  // Individual session deletion states
  deletingSessionId: number | null = null;
  showDeleteModal = false;
  sessionToDelete: Session | null = null;
  
  // Clear all sessions states
  showClearAllModal = false;

  constructor(
    private apiService: ApiService,
    private timerService: TimerService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentSession$ = this.timerService.currentSession$;
  }

  ngOnInit(): void {
    this.loadRecentSessions();
    
    // Listen for session changes and refresh the list
    this.timerService.sessionChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('SessionHistoryComponent: Received session change notification');
        // Load sessions immediately since timer service waits for API completion
        this.loadRecentSessions();
        // Force change detection to update the UI
        this.cdr.detectChanges();
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
          // Force change detection to update the UI
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load recent sessions:', error);
        }
      });
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
          
          // Notify that sessions have changed to update statistics
          this.timerService.notifySessionChanged();
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
        return 'bg-danger-bg text-danger';
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
   * Opens the clear all sessions confirmation modal
   */
  openClearAllModal(): void {
    this.showClearAllModal = true;
  }

  /**
   * Closes the clear all sessions confirmation modal
   */
  closeClearAllModal(): void {
    // Only allow closing if not currently clearing
    if (!this.isClearing) {
      this.showClearAllModal = false;
    }
  }

  /**
   * Confirms and executes the clear all sessions operation
   * Uses the beautiful modal for confirmation
   */
  confirmClearAll(): void {
    if (this.isClearing) return;
    
    this.isClearing = true;
    
    this.apiService.clearAllSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('All sessions cleared:', response);
          // Clear local sessions list
          this.recentSessions = [];
          // Close modal and reset state
          this.showClearAllModal = false;
          this.isClearing = false;
          // Refresh the session list to show empty state
          this.loadRecentSessions();
          
          // Notify that sessions have changed to update statistics
          this.timerService.notifySessionChanged();
        },
        error: (error) => {
          console.error('Failed to clear sessions:', error);
          this.isClearing = false;
          alert('Failed to clear sessions. Please try again.');
        }
      });
  }

}
