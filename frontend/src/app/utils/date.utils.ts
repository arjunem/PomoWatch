/**
 * Utility functions for consistent date handling across the application
 * Ensures all dates are treated as UTC to avoid timezone conversion issues
 */

/**
 * Parses a date string from the API and ensures it's treated as UTC
 * @param dateString ISO date string from the backend
 * @returns Date object properly configured as UTC
 */
export function parseUtcDate(dateString: string): Date {
  // Create date from ISO string and ensure it's treated as UTC
  const date = new Date(dateString);
  
  // If the date string doesn't include timezone info, assume it's UTC
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-')) {
    // Add 'Z' to indicate UTC if not present
    return new Date(dateString + 'Z');
  }
  
  return date;
}

/**
 * Formats a date for display in the user's local timezone
 * @param date Date object (should be UTC)
 * @param options Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in local timezone
 */
export function formatLocalDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
}

/**
 * Gets the current time as UTC ISO string
 * @returns Current UTC time as ISO string
 */
export function getCurrentUtcIsoString(): string {
  return new Date().toISOString();
}

/**
 * Calculates elapsed time between two dates in seconds
 * @param startDate Start date (should be UTC)
 * @param endDate End date (defaults to now if not provided)
 * @returns Elapsed time in seconds
 */
export function calculateElapsedSeconds(startDate: Date, endDate?: Date): number {
  const start = startDate.getTime();
  const end = (endDate || new Date()).getTime();
  return Math.floor((end - start) / 1000);
}

/**
 * Converts minutes to seconds
 * @param minutes Number of minutes
 * @returns Number of seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Converts seconds to minutes
 * @param seconds Number of seconds
 * @returns Number of minutes
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}
