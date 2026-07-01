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

  let nextId = 6

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

  function addExpense(data: { amount: number; category: string; business: string; notes: string }) {
    const biz = businesses.value.find(b => b.name === data.business)
    if (biz) biz.balance = Math.max(0, biz.balance - data.amount)
    expenses.value.unshift({ id: nextId++, ...data, createdAt: new Date() })
  }

  return { businesses, expenses, todayExpenses, todayTotal, addExpense }
})
