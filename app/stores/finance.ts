import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const NON_BUSINESS_SOURCES = [
  'Gaji',
  'Freelance',
  'Dividen',
  'Sewa Pribadi',
  'Hadiah',
  'Lainnya',
] as const

export type NonBusinessSource = typeof NON_BUSINESS_SOURCES[number]

export interface Business {
  id: string
  name: string
  balance: number
}

export interface Expense {
  id: number
  amount: number
  category: string
  business: string
  notes: string
  createdAt: Date
}

export interface Income {
  id: number
  amount: number
  category: string
  sourceType: 'business' | 'personal'
  source: string
  notes: string
  createdAt: Date
}

export const useFinanceStore = defineStore('finance', () => {
  const businesses = ref<Business[]>([
    { id: 'rumah-makan',     name: 'Rumah Makan',    balance: 5_000_000  },
    { id: 'kolam-renang',    name: 'Kolam Renang',   balance: 8_000_000  },
    { id: 'coffee-shop',     name: 'Coffee Shop',    balance: 3_500_000  },
    { id: 'angkringan',      name: 'Angkringan',     balance: 1_200_000  },
    { id: 'bengkel',         name: 'Bengkel',        balance: 4_800_000  },
    { id: 'toko-kelontong',  name: 'Toko Kelontong', balance: 2_300_000  },
    { id: 'toko-emas',       name: 'Toko Emas',      balance: 15_000_000 },
    { id: 'lapangan-futsal', name: 'Lap. Futsal',    balance: 6_700_000  },
  ])

  let nextExpenseId = 6
  let nextIncomeId = 6

  const incomes = ref<Income[]>([
    {
      id: 1,
      amount: 2_500_000,
      category: 'Penjualan',
      sourceType: 'business',
      source: 'Rumah Makan',
      notes: 'Pendapatan harian',
      createdAt: new Date(Date.now() - 2 * 3_600_000),
    },
    {
      id: 2,
      amount: 1_800_000,
      category: 'Penjualan',
      sourceType: 'business',
      source: 'Coffee Shop',
      notes: '',
      createdAt: new Date(Date.now() - 4 * 3_600_000),
    },
    {
      id: 3,
      amount: 3_200_000,
      category: 'Jasa',
      sourceType: 'business',
      source: 'Bengkel',
      notes: 'Servis 3 kendaraan',
      createdAt: new Date(Date.now() - 1 * 86_400_000),
    },
    {
      id: 4,
      amount: 5_000_000,
      category: 'Penjualan',
      sourceType: 'business',
      source: 'Toko Emas',
      notes: '',
      createdAt: new Date(Date.now() - 2 * 86_400_000),
    },
    {
      id: 5,
      amount: 750_000,
      category: 'Lainnya',
      sourceType: 'personal',
      source: 'Gaji',
      notes: 'Gaji mingguan',
      createdAt: new Date(Date.now() - 3 * 86_400_000),
    },
  ])

  const expenses = ref<Expense[]>([
    {
      id: 1,
      amount: 250_000,
      category: 'Belanja Bahan',
      business: 'Rumah Makan',
      notes: 'Beli sayur dan bumbu',
      createdAt: new Date(Date.now() - 1 * 3_600_000),
    },
    {
      id: 2,
      amount: 500_000,
      category: 'Bayar Listrik',
      business: 'Kolam Renang',
      notes: '',
      createdAt: new Date(Date.now() - 3 * 3_600_000),
    },
    {
      id: 3,
      amount: 75_000,
      category: 'BBM',
      business: 'Bengkel',
      notes: 'Bensin motor operasional',
      createdAt: new Date(Date.now() - 5 * 3_600_000),
    },
    {
      id: 4,
      amount: 1_800_000,
      category: 'Gaji Karyawan',
      business: 'Coffee Shop',
      notes: 'Gaji kasir bulan ini',
      createdAt: new Date(Date.now() - 2 * 86_400_000),
    },
    {
      id: 5,
      amount: 350_000,
      category: 'Perlengkapan',
      business: 'Toko Kelontong',
      notes: 'Beli kantong plastik dan struk',
      createdAt: new Date(Date.now() - 3 * 86_400_000),
    },
  ])

  const todayExpenses = computed(() => {
    const today = new Date().toDateString()
    return expenses.value.filter(e => new Date(e.createdAt).toDateString() === today)
  })

  const todayTotal = computed(() =>
    todayExpenses.value.reduce((sum, e) => sum + e.amount, 0),
  )

  const todayIncomes = computed(() => {
    const today = new Date().toDateString()
    return incomes.value.filter(i => new Date(i.createdAt).toDateString() === today)
  })

  const todayIncomeTotal = computed(() =>
    todayIncomes.value.reduce((sum, i) => sum + i.amount, 0),
  )

  const totalIncome = computed(() =>
    incomes.value.reduce((sum, i) => sum + i.amount, 0),
  )

  function addExpense(data: { amount: number; category: string; business: string; notes: string }) {
    const biz = businesses.value.find(b => b.name === data.business)
    if (biz) biz.balance = Math.max(0, biz.balance - data.amount)
    expenses.value.unshift({ id: nextExpenseId++, ...data, createdAt: new Date() })
  }

  function addIncome(data: { amount: number; category: string; sourceType: 'business' | 'personal'; source: string; notes: string }) {
    const biz = data.sourceType === 'business'
      ? businesses.value.find(b => b.name === data.source)
      : undefined
    if (biz) biz.balance = biz.balance + data.amount
    incomes.value.unshift({ id: nextIncomeId++, ...data, createdAt: new Date() })
  }

  return { businesses, expenses, incomes, todayExpenses, todayTotal, todayIncomes, todayIncomeTotal, totalIncome, addExpense, addIncome }
})
