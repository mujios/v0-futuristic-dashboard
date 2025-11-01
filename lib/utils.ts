import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFiscalYear = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  // If the month is April (index 3) or later, the fiscal year starts this calendar year.
  const fiscalStartYear = date.getMonth() >= 3 ? year : year - 1
  const fiscalEndYear = fiscalStartYear + 1
  // Returns "YY-YY" format (e.g., "25-26")
  return `${fiscalStartYear}-${fiscalEndYear}`.slice(2) 
}
