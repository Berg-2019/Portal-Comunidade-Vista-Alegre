import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Parse a date string safely, handling various formats and timezone issues
 * @param dateString - Date string in various formats (YYYY-MM-DD, ISO, etc)
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    // Remove any timezone information and time component
    let cleanDate = dateString;
    
    // If it's an ISO string with time, extract just the date part
    if (cleanDate.includes('T')) {
      cleanDate = cleanDate.split('T')[0];
    }
    
    // If it's a date with timezone offset, extract just the date part
    if (cleanDate.includes('+') || cleanDate.match(/Z$/)) {
      cleanDate = cleanDate.split(/[+Z]/)[0].split('T')[0];
    }

    // Parse as YYYY-MM-DD format at noon local time to avoid timezone issues
    const parsedDate = parse(cleanDate, 'yyyy-MM-dd', new Date());
    
    if (!isValid(parsedDate)) {
      console.warn('Invalid date:', dateString);
      return null;
    }
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
}

/**
 * Format a date string to Brazilian format (dd/MM/yyyy)
 * @param dateString - Date string to format
 * @returns Formatted date string or '-' if invalid
 */
export function formatDateBR(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  if (!date) return '-';
  
  try {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '-';
  }
}

/**
 * Format a date string to ISO format (YYYY-MM-DD) for input fields
 * @param dateString - Date string to format
 * @returns ISO formatted date string or empty string if invalid
 */
export function formatDateISO(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  if (!date) return '';
  
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date to ISO:', dateString, error);
    return '';
  }
}

/**
 * Get a date string in YYYY-MM-DD format for database storage
 * Ensures no timezone conversion issues
 * @param date - Date object or date string
 * @returns Date string in YYYY-MM-DD format
 */
export function toDateString(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      const parsed = parseDate(date);
      if (!parsed) return '';
      return format(parsed, 'yyyy-MM-dd');
    }
    
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error converting to date string:', date, error);
    return '';
  }
}

/**
 * Check if a date string is valid
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  return date !== null && isValid(date);
}

/**
 * Calculate difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days difference
 */
export function daysDifference(date1: string | Date, date2: string | Date): number {
  try {
    const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
    
    if (!d1 || !d2 || !isValid(d1) || !isValid(d2)) return 0;
    
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days difference:', error);
    return 0;
  }
}
