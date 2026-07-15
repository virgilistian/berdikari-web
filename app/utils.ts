import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as Indonesian Rupiah, e.g. 15000 → "Rp 15.000". */
export function formatRupiah(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  return 'Rp ' + (Number.isFinite(n) ? n : 0).toLocaleString('id-ID')
}

/** Indonesian month names (index 0 = Januari), shared across the Tax module. */
export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]


/**
 * Download tabular data as a CSV file (client-side export).
 * Values containing separators/quotes/newlines are quoted per RFC 4180.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const escape = (value: string | number | null | undefined): string => {
    const s = String(value ?? '')
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map(row => row.map(escape).join(';')).join('\r\n')
  // BOM so Excel opens the file with the correct encoding.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
