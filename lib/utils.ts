import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFiscalYear = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  // Assumes a typical fiscal year that starts sometime during the given year (e.g., starts in 2025 for 2025-26)
  const currentMonth = date.getMonth();
  // Assuming ERPNext default: Fiscal Year typically starts April 1st (index 3).
  const fiscalStartYear = currentMonth >= 3 ? year : year - 1;
  const fiscalEndYear = fiscalStartYear + 1;
  return `${fiscalStartYear}-${fiscalEndYear}`.slice(2); // Returns "YY-YY" format, e.g., "25-26"
};
