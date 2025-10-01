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

export interface StartSessionRequest {
  durationMinutes: number;
}

export interface TimerState {
  currentSession: Session | null;
  remainingTime: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  sessionType: 'work' | 'break';
  totalDuration: number; // in seconds
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}
