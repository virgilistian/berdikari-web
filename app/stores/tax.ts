import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface TaxColumnMeta {
  key: string
  label: string
  editable: boolean
  type: 'number' | 'text' | 'boolean'
}

export interface TaxBusinessType {
  key: string
  label: string
  columns: TaxColumnMeta[]
}

export interface TaxProfile {
  id: string
  business_id: string
  business_type: string
  npwpd: string | null
  company_name: string | null
  company_address: string | null
  owner_name: string | null
  config_overrides: Record<string, any> | null
}

export interface TaxAsset {
  id: string
  business_id: string
  type: 'signature' | 'stamp'
  disk: string
  path: string
  original_filename: string | null
  mime_type: string | null
  width: number | null
  height: number | null
  data_uri: string | null
}

export interface TaxReportEntry {
  id: string
  tax_report_id: string
  day_number: number
  weekday_name: string
  is_weekend: boolean
  is_holiday: boolean
  holiday_name: string | null
  ticket_qty: number | null
  ticket_price: number | string | null
  sales: number | string
  tax: number | string
  is_manually_edited: boolean
}

export interface TaxReport {
  id: string
  business_id: string
  business_type: string
  period_month: number
  period_year: number
  status: 'draft' | 'final'
  holiday_count_in_month: number
  monthly_cap: number | string
  total_sales: number | string
  total_tax: number | string
  was_normalized: boolean
  config_snapshot: Record<string, any> | null
  print_count: number
  last_printed_at: string | null
  entries?: TaxReportEntry[]
}

export const useTaxStore = defineStore('tax', () => {
  const businessTypes = ref<TaxBusinessType[]>([])
  const profiles = ref<TaxProfile[]>([])
  const assets = ref<TaxAsset[]>([])
  const history = ref<TaxReport[]>([])
  const currentReport = ref<TaxReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const taxPercentage = computed(() => {
    const snapshot = currentReport.value?.config_snapshot
    return Number(snapshot?.tax_percentage ?? 0.1)
  })

  async function fetchBusinessTypes() {
    try {
      const api = useApi()
      const res = await api<{ data: TaxBusinessType[] }>('/v1/tax/business-types')
      businessTypes.value = res.data
    } catch {
      businessTypes.value = []
    }
  }

  async function fetchProfiles() {
    try {
      const api = useApi()
      const res = await api<{ data: TaxProfile[] }>('/v1/tax/profiles')
      profiles.value = res.data
    } catch {
      profiles.value = []
    }
  }

  async function saveProfile(type: string, data: Partial<TaxProfile>) {
    const api = useApi()
    const res = await api<{ data: TaxProfile }>(`/v1/tax/profiles/${type}`, { method: 'PUT', body: data })
    const idx = profiles.value.findIndex(p => p.business_type === type)
    if (idx !== -1) profiles.value[idx] = res.data
    else profiles.value.push(res.data)
    return res.data
  }

  async function fetchAssets() {
    try {
      const api = useApi()
      const res = await api<{ data: TaxAsset[] }>('/v1/tax/assets')
      assets.value = res.data
    } catch {
      assets.value = []
    }
  }

  async function uploadAsset(type: 'signature' | 'stamp', file: File) {
    const api = useApi()
    const body = new FormData()
    body.append('file', file)
    const res = await api<{ data: TaxAsset }>(`/v1/tax/assets/${type}`, { method: 'POST', body })
    const idx = assets.value.findIndex(a => a.type === type)
    if (idx !== -1) assets.value[idx] = res.data
    else assets.value.push(res.data)
    return res.data
  }

  async function removeAsset(type: 'signature' | 'stamp') {
    const api = useApi()
    await api(`/v1/tax/assets/${type}`, { method: 'DELETE' })
    assets.value = assets.value.filter(a => a.type !== type)
  }

  async function generate(businessType: string, month: number, year: number) {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: TaxReport }>('/v1/tax/generate', {
        method: 'POST',
        body: { business_type: businessType, month, year },
      })
      currentReport.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Data pajak belum bisa dibuat. Coba lagi sebentar, ya.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory(filters: { business_type?: string; period_year?: number } = {}) {
    loading.value = true
    try {
      const api = useApi()
      const res = await api<{ data: TaxReport[] }>('/v1/tax/reports', { query: filters })
      history.value = res.data
    } catch {
      history.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchReport(id: string) {
    const api = useApi()
    const res = await api<{ data: TaxReport }>(`/v1/tax/reports/${id}`)
    currentReport.value = res.data
    return res.data
  }

  function clearCurrentReport() {
    currentReport.value = null
  }

  /**
   * Local recompute mirroring the backend formula, for instant feedback
   * while editing — the authoritative recompute still happens server-side
   * on save (and enforces the monthly cap).
   */
  function updateEntry(dayNumber: number, patch: { sales?: number; ticket_qty?: number; ticket_price?: number }) {
    if (!currentReport.value?.entries) return
    const entry = currentReport.value.entries.find(e => e.day_number === dayNumber)
    if (!entry) return

    Object.assign(entry, patch)
    entry.is_manually_edited = true

    if (entry.ticket_qty !== null && entry.ticket_price !== null) {
      const qty = Number(entry.ticket_qty) || 0
      const price = Number(entry.ticket_price) || 0
      entry.sales = Math.round(qty * price)
    }

    entry.tax = Math.round(Number(entry.sales) * taxPercentage.value)

    currentReport.value.total_sales = currentReport.value.entries.reduce((sum, e) => sum + Number(e.sales), 0)
    currentReport.value.total_tax = currentReport.value.entries.reduce((sum, e) => sum + Number(e.tax), 0)
  }

  async function saveReport(id: string, finalize = false) {
    if (!currentReport.value?.entries) throw new Error('Tidak ada data untuk disimpan.')

    const entries = currentReport.value.entries.map(e => ({
      day_number: e.day_number,
      sales: e.sales,
      ticket_qty: e.ticket_qty,
      ticket_price: e.ticket_price,
    }))

    const api = useApi()
    const res = await api<{ data: TaxReport }>(`/v1/tax/reports/${id}`, {
      method: 'PUT',
      body: { entries, finalize },
    })
    currentReport.value = res.data
    return res.data
  }

  async function deleteReport(id: string) {
    const api = useApi()
    await api(`/v1/tax/reports/${id}`, { method: 'DELETE' })
    history.value = history.value.filter(r => r.id !== id)
  }

  async function printPdf(id: string) {
    const api = useApi()
    const blob = await api<Blob>(`/v1/tax/reports/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob as Blob)
    window.open(url, '_blank')
  }

  return {
    businessTypes, profiles, assets, history, currentReport, loading, error,
    fetchBusinessTypes, fetchProfiles, saveProfile, fetchAssets, uploadAsset, removeAsset,
    generate, fetchHistory, fetchReport, clearCurrentReport, updateEntry, saveReport, deleteReport, printPdf,
  }
})
