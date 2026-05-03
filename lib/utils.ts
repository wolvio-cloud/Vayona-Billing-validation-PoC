import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatINRShort(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`
  return formatINR(amount)
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%'
  return `${value.toFixed(2)}%`
}

export function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

