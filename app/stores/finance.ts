import { defineStore } from 'pinia'
import { ref } from 'vue'

export const EXPENSE_CATEGORIES = [
  'Belanja Bahan',
  'Bayar Listrik',
  'Bayar Air',
  'Gaji Karyawan',
  'Perbaikan',
  'Transportasi',
  'BBM',
  'Sewa',
  'Perlengkapan',
  'Lainnya',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export const INCOME_CATEGORIES = [
  'Penjualan',
  'Jasa',
  'Pembayaran Piutang',
  'Investasi',
  'Hibah',
  'Lainnya',
] as const

export type IncomeCategory = typeof INCOME_CATEGORIES[number]

export interface BusinessOption {
  id: string
  name: string
}

export interface FinanceCategory {
  id: string
  name: string
  type: 'income' | 'expense'
}

export interface FinanceEntry {
  id: string
  type: 'income' | 'expense'
  amount: number | string
  category: string
  note: string | null
  source_type: string | null
  source_id: string | null
  occurred_at: string
  business_id: string | null
  business_name: string | null
}

export interface FinanceSummary {
  from: string
  to: string
  total_income: number
  total_expense: number
  net: number
  income_by_category: Record<string, number>
  expense_by_category: Record<string, number>
}

export const useFinanceStore = defineStore('finance', () => {
  const entries = ref<FinanceEntry[]>([])
  const summary = ref<FinanceSummary | null>(null)
  const businesses = ref<BusinessOption[]>([])
  const categories = ref<FinanceCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEntries(filters: { type?: string; category?: string; from?: string; to?: string; business_id?: string } = {}) {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: FinanceEntry[] }>('/v1/finance', { query: filters })
      entries.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Transaksi belum bisa dimuat. Coba lagi sebentar, ya.'
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary(range: { from?: string; to?: string } = {}) {
    try {
      const api = useApi()
      const res = await api<{ data: FinanceSummary }>('/v1/finance/summary', { query: range })
      summary.value = res.data
    } catch {
      summary.value = null
    }
  }

  async function fetchBusinesses() {
    try {
      const api = useApi()
      const res = await api<{ data: BusinessOption[] }>('/v1/businesses')
      businesses.value = res.data
    } catch {
      businesses.value = []
    }
  }

  async function createEntry(data: {
    type: 'income' | 'expense'
    amount: number
    category: string
    note?: string
    business_id?: string
    occurred_at?: string
    shift_id?: string
  }) {
    const api = useApi()
    const res = await api<{ data: FinanceEntry }>('/v1/finance', { method: 'POST', body: data })
    if (!data.shift_id) await fetchEntries()
    return res.data
  }

  /** Operational expenses recorded against a specific cashier shift (does not touch the global `entries` list). */
  async function fetchShiftExpenses(shiftId: string): Promise<FinanceEntry[]> {
    const api = useApi()
    const res = await api<{ data: FinanceEntry[] }>('/v1/finance', {
      query: { source_type: 'shift_expense', source_id: shiftId },
    })
    return res.data
  }

  async function fetchEntry(id: string): Promise<FinanceEntry> {
    const api = useApi()
    const res = await api<{ data: FinanceEntry }>(`/v1/finance/${id}`)
    return res.data
  }

  async function updateEntry(id: string, data: {
    type: 'income' | 'expense'
    amount: number
    category: string
    note?: string
    occurred_at?: string
  }) {
    const api = useApi()
    const res = await api<{ data: FinanceEntry }>(`/v1/finance/${id}`, { method: 'PUT', body: data })
    const idx = entries.value.findIndex(e => e.id === id)
    if (idx !== -1) entries.value[idx] = res.data
    return res.data
  }

  async function deleteEntry(id: string) {
    const api = useApi()
    await api(`/v1/finance/${id}`, { method: 'DELETE' })
    entries.value = entries.value.filter(e => e.id !== id)
  }

  async function fetchCategories() {
    try {
      const api = useApi()
      const res = await api<{ data: FinanceCategory[] }>('/v1/finance/categories')
      categories.value = res.data
    } catch {
      categories.value = []
    }
  }

  async function createCategory(data: { name: string; type: 'income' | 'expense' }) {
    const api = useApi()
    const res = await api<{ data: FinanceCategory }>('/v1/finance/categories', { method: 'POST', body: data })
    categories.value.push(res.data)
    return res.data
  }

  async function updateCategory(id: string, name: string) {
    const api = useApi()
    const res = await api<{ data: FinanceCategory }>(`/v1/finance/categories/${id}`, { method: 'PUT', body: { name } })
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = res.data
    return res.data
  }

  async function deleteCategory(id: string) {
    const api = useApi()
    await api(`/v1/finance/categories/${id}`, { method: 'DELETE' })
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return {
    entries, summary, businesses, categories, loading, error,
    fetchEntries, fetchSummary, fetchBusinesses, createEntry, fetchEntry, updateEntry, deleteEntry,
    fetchCategories, createCategory, updateCategory, deleteCategory, fetchShiftExpenses,
  }
})
