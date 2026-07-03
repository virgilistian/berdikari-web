import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface DailyStockItem {
  id: string
  product_id: string
  product_name: string
  opening_qty: number
  sold_qty: number
  closing_qty: number | null
  status: 'open' | 'closed'
}

const DUMMY_BUSINESS_ID = '123e4567-e89b-12d3-a456-426614174000'

export const useDailyStockStore = defineStore('dailyStock', () => {
  const stocks = ref<DailyStockItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const today: string = new Date().toISOString().split('T')[0]!

  const hasStocks = computed(() => stocks.value.length > 0)
  const isOpen = computed(() => stocks.value.some(s => s.status === 'open'))
  const isClosed = computed(() => stocks.value.length > 0 && stocks.value.every(s => s.status === 'closed'))

  async function fetchToday() {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: DailyStockItem[] }>(
        `/api/v1/inventory/daily-stock/${today}`,
        { query: { business_id: DUMMY_BUSINESS_ID } }
      )
      stocks.value = res.data
    } catch {
      stocks.value = []
    } finally {
      loading.value = false
    }
  }

  async function openDay(items: { product_id: string; product_name: string; opening_qty: number }[]) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: DailyStockItem[] }>('/api/v1/inventory/daily-stock/open', {
        method: 'POST',
        body: { business_id: DUMMY_BUSINESS_ID, date: today, items },
      })
      stocks.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuka stok.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function closeDay() {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: DailyStockItem[] }>('/api/v1/inventory/daily-stock/close', {
        method: 'POST',
        body: { business_id: DUMMY_BUSINESS_ID, date: today },
      })
      stocks.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menutup hari.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    stocks, loading, error, today,
    hasStocks, isOpen, isClosed,
    fetchToday, openDay, closeDay,
  }
})
