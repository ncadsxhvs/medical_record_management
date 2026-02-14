/**
 * Date utility functions for consistent date handling across the application
 * Handles timezone-independent date parsing and formatting
 */

/**
 * Parse a date string (YYYY-MM-DD or ISO format) as a local date
 * Avoids timezone shifts by creating Date with local components
 */
export function parseLocalDate(dateStr: string): Date {
  // Extract just the date part (YYYY-MM-DD) from the date string
  const dateOnly = dateStr.toString().split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);

  // Create date in local timezone (month is 0-indexed in JavaScript)
  return new Date(year, month - 1, day);
}

/**
 * Format a date string for display
 */
export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate total RVU from procedures (including quantity)
 */
export function calculateTotalRVU(procedures: Array<{ work_rvu: number; quantity?: number }>): number {
  return procedures.reduce((sum, proc) => {
    const rvu = Number(proc.work_rvu) || 0;
    const qty = Number(proc.quantity) || 1;
    return sum + (rvu * qty);
  }, 0);
}

/**
 * Format a time string (HH:MM or HH:MM:SS) to 12-hour display format
 * "14:30" → "2:30 PM", "09:05" → "9:05 AM"
 */
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Format a date string with optional time for display
 * Returns "Tue, Dec 2, 2025" or "Tue, Dec 2, 2025 at 2:30 PM" if time provided
 */
export function formatDateWithTime(dateStr: string, timeStr?: string | null): string {
  const dateFormatted = formatDate(dateStr);
  if (timeStr) {
    return `${dateFormatted} at ${formatTime(timeStr)}`;
  }
  return dateFormatted;
}

/**
 * Get the current time as HH:MM string
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validate if a string is a valid date in YYYY-MM-DD format
 */
export function isValidDateString(dateStr: string): boolean {
  // Extract just the date part for ISO datetime strings
  const dateOnly = dateStr.toString().split('T')[0];

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateOnly)) {
    return false;
  }

  try {
    const date = parseLocalDate(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}
