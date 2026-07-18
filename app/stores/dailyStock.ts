import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface DailyStockItem {
  id: string
  product_id: string
  product_name: string
  price: number | null
  image_url: string | null
  opening_qty: number
  adjustment_qty: number
  sold_qty: number
  closing_qty: number | null
  status: 'draft' | 'open' | 'closed'
  current_stock?: number | null
  remaining_qty?: number
}

export interface ProductForStock {
  id: string
  name: string
  price: number | null
  image_url: string | null
  current_stock: number
  min_stock: number
}

export interface DailyStockHistoryRow {
  date: string
  total_menu_items: number
  total_opening_qty: number
  total_closing_qty: number
  status: 'draft' | 'open' | 'closed'
}

export const useDailyStockStore = defineStore('dailyStock', () => {
  const stocks = ref<DailyStockItem[]>([])
  const products = ref<ProductForStock[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const today: string = new Date().toISOString().split('T')[0]!

  const history = ref<DailyStockHistoryRow[]>([])
  const historyLoading = ref(false)
  const dayDetail = ref<DailyStockItem[]>([])
  const dayDetailLoading = ref(false)

  const hasStocks = computed(() => stocks.value.length > 0)
  const isOpen = computed(() => stocks.value.some(s => s.status === 'open'))
  const isClosed = computed(() => stocks.value.length > 0 && stocks.value.every(s => s.status === 'closed'))

  function businessId(): string | null {
    return useAuthStore().user?.business_id ?? null
  }

  async function fetchToday() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: DailyStockItem[] }>(
        `/v1/inventory/daily-stock/${today}`,
        { query: { business_id: businessId() } }
      )
      stocks.value = res.data
    } catch {
      stocks.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory() {
    historyLoading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: DailyStockHistoryRow[] }>('/v1/inventory/daily-stock/history', {
        query: { business_id: businessId() },
      })
      history.value = res.data
    } catch {
      history.value = []
    } finally {
      historyLoading.value = false
    }
  }

  async function fetchDayDetail(date: string) {
    dayDetailLoading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: DailyStockItem[] }>(`/v1/inventory/daily-stock/${date}`, {
        query: { business_id: businessId() },
      })
      dayDetail.value = res.data
    } catch {
      dayDetail.value = []
    } finally {
      dayDetailLoading.value = false
    }
  }

  async function fetchProducts() {
    loading.value = true
    try {
      const api = useApi()
      const res = await api<{ data: ProductForStock[] }>('/v1/inventory/daily-stock/products', {
        query: { business_id: businessId() },
      })
      products.value = res.data
    } catch {
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function openDay(items: { product_id: string; product_name: string; opening_qty: number }[], date: string = today) {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: DailyStockItem[] }>('/v1/inventory/daily-stock/open', {
        method: 'POST',
        body: { business_id: businessId(), date, items },
      })
      // `stocks` backs the "today" reconciliation view (e.g. shift close) — only
      // refresh it when the opened date is today; other dates use `dayDetail`.
      if (date === today) stocks.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Stok belum bisa dibuka. Coba lagi sebentar, ya.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function adjustStock(productId: string, adjustmentQty: number, note?: string) {
    const api = useApi()
    error.value = null
    try {
      const res = await api<{ data: DailyStockItem }>('/v1/inventory/daily-stock/adjust', {
        method: 'POST',
        body: {
          business_id: businessId(),
          date: today,
          product_id: productId,
          adjustment_qty: adjustmentQty,
          adjustment_note: note,
        },
      })
      const idx = stocks.value.findIndex(s => s.product_id === productId)
      if (idx !== -1) stocks.value[idx] = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Penyesuaian stok belum bisa disimpan. Coba lagi sebentar, ya.'
      throw e
    }
  }

  async function deleteDay(date: string) {
    error.value = null
    try {
      const api = useApi()
      await api(`/v1/inventory/daily-stock/${date}`, {
        method: 'DELETE',
        query: { business_id: businessId() },
      })
      history.value = history.value.filter(h => h.date !== date)
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Draf stok belum bisa dihapus. Coba lagi sebentar, ya.'
      throw e
    }
  }

  /**
   * [DEV] Delete a daily-stock day regardless of status. Only reachable
   * behind an `import.meta.dev` UI gate — the API itself 404s in production.
   */
  async function deleteDayForDev(date: string, force = false) {
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: { deleted_count: number; was_closed: boolean } }>(
        `/v1/inventory/daily-stock/dev/${date}`,
        {
          // Laravel's `boolean` validation rule only accepts 1/0/'1'/'0' —
          // not the literal strings "true"/"false" ofetch would serialize.
          method: 'DELETE',
          query: { business_id: businessId(), force: force ? 1 : 0 },
        }
      )
      history.value = history.value.filter(h => h.date !== date)
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Stok harian belum bisa dihapus. Coba lagi sebentar, ya.'
      throw e
    }
  }

  return {
    stocks, products, loading, error, today,
    hasStocks, isOpen, isClosed,
    fetchToday, fetchProducts, openDay, adjustStock, deleteDay, deleteDayForDev,
    history, historyLoading, fetchHistory,
    dayDetail, dayDetailLoading, fetchDayDetail,
  }
})
