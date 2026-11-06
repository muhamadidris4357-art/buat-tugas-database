import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const DATE_FORMATS: Record<string, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY/MM/DD': 'yyyy/MM/dd',
  'DD-MM-YYYY': 'dd-MM-yyyy',
  'MM-DD-YYYY': 'MM-dd-yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

export const LANGUAGES: Array<{ code: string; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文（简体）' },
];

/**
 * Format a date string according to the user's date format and timezone.
 */
export function formatDate(
  dateString: string | null | undefined,
  userDateFormat: string = 'DD/MM/YYYY',
  userTimezone: string = 'Asia/Jakarta'
): string {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    const tf = DATE_FORMATS[userDateFormat] || 'dd/MM/yyyy';
    return formatInTimeZone(date, userTimezone, tf);
  } catch {
    return dateString;
  }
}

/**
 * Format date with time.
 */
export function formatDateTime(
  dateString: string | null | undefined,
  userDateFormat: string = 'DD/MM/YYYY',
  userTimezone: string = 'Asia/Jakarta'
): string {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    const tf = DATE_FORMATS[userDateFormat] || 'dd/MM/yyyy';
    return formatInTimeZone(date, userTimezone, `${tf} HH:mm`);
  } catch {
    return dateString;
  }
}

/**
 * Relative time (e.g. "2 hours ago").
 */
export function timeAgo(dateString: string | null | undefined, userTimezone: string = 'Asia/Jakarta'): string {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    const zoned = toZonedTime(date, userTimezone);
    return formatDistanceToNow(zoned, { addSuffix: true });
  } catch {
    return dateString;
  }
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Priority label and color config.
 */
export const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Rendah', color: 'text-gray-400', bg: 'bg-gray-800/50' },
  medium: { label: 'Sedang', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  high: { label: 'Tinggi', color: 'text-orange-400', bg: 'bg-orange-900/30' },
  urgent: { label: 'Mendesak', color: 'text-red-400', bg: 'bg-red-900/30' },
};

/**
 * Status label config.
 */
export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Menunggu', color: 'text-gray-400', bg: 'bg-gray-800/50' },
  in_progress: { label: 'Dikerjakan', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  in_review: { label: 'Direview', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  completed: { label: 'Selesai', color: 'text-green-400', bg: 'bg-green-900/30' },
  blocked: { label: 'Diblokir', color: 'text-red-400', bg: 'bg-red-900/30' },
  submitted: { label: 'Diajukan', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  reviewed: { label: 'Direview', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  approved: { label: 'Disetujui', color: 'text-green-400', bg: 'bg-green-900/30' },
  revision_requested: { label: 'Revisi', color: 'text-orange-400', bg: 'bg-orange-900/30' },
};

/**
 * Role label config.
 */
export const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PLATFORM_OWNER: { label: 'Platform Owner', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  COMPANY_ADMIN: { label: 'Admin Perusahaan', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  EMPLOYEE: { label: 'Karyawan', color: 'text-green-400', bg: 'bg-green-900/30' },
};

/**
 * Company status label config.
 */
export const COMPANY_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktif', color: 'text-green-400', bg: 'bg-green-900/30' },
  suspended: { label: 'Disediakan', color: 'text-red-400', bg: 'bg-red-900/30' },
  trial: { label: 'Trial', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
};

/**
 * Format currency (IDR by default, locale-aware).
 */
export function formatCurrency(amount: number, locale: string = 'id-ID', currency: string = 'IDR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Generate a random ID (client-side fallback).
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;
}

/**
 * Debounce function for search inputs.
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}
