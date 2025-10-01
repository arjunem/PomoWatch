/**
 * Represents a Pomodoro session in the system
 * Contains all information about a work or break session
 */
export interface Session {
  id: number;
  type: 'work' | 'break';
  startTime: string;
  endTime?: string;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  durationMinutes: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Request model for starting a new Pomodoro session
 * Used when creating work or break sessions
 */
export interface StartSessionRequest {
  durationMinutes: number;
}

/**
 * Represents the current state of the timer
 * Used for reactive UI updates and state management
 */
export interface TimerState {
  currentSession: Session | null;
  remainingTime: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  sessionType: 'work' | 'break';
  totalDuration: number; // in seconds
}

/**
 * User-configurable settings for the Pomodoro timer
 * Controls durations, behavior, and preferences
 */
export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}
