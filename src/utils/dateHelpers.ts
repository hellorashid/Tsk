/**
 * Shared date utility functions used across schedule components
 */

/**
 * Format date for display (e.g., "Wednesday, December 17, 2025")
 */
export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Get date at start of day (midnight)
 */
export const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Get current time in minutes from midnight
 */
export const getCurrentTimeInMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/**
 * Format time for display in 12-hour format (e.g., "2:30 PM")
 */
export const formatTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Format time compact (12-hour, no AM/PM, e.g., "2:30")
 */
export const formatTimeCompact = (dateTime: string): string => {
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour12}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

/**
 * Check if an event is on a specific date
 */
export const isEventOnDate = (eventDateTime: string | undefined, targetDate: Date): boolean => {
  if (!eventDateTime) return false;
  
  const eventDate = new Date(eventDateTime);
  
  return (
    eventDate.getFullYear() === targetDate.getFullYear() &&
    eventDate.getMonth() === targetDate.getMonth() &&
    eventDate.getDate() === targetDate.getDate()
  );
};

/**
 * Date navigation helpers - returns new Date objects
 */
export const getPreviousDay = (date: Date): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  return getStartOfDay(prevDay);
};

export const getNextDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return getStartOfDay(nextDay);
};

