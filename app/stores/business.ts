import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restoran' },
  { value: 'swimming_pool', label: 'Kolam Renang' },
  { value: 'retail', label: 'Retail / Toko' },
  { value: 'service', label: 'Jasa' },
  { value: 'other', label: 'Lainnya' },
] as const

export interface Business {
  id: string
  name: string
  tax_id: string | null
  type: string | null
  code: string | null
  address: string | null
  phone: string | null
  logo_path: string | null
  logo_data_uri: string | null
  status: 'active' | 'inactive'
}

export interface BusinessForm {
  id?: string
  name: string
  type: string
  code: string
  address: string | null
  phone: string | null
}

export interface Branch {
  id: string
  business_id: string
  name: string
  address: string | null
}

export interface BranchForm {
  id?: string
  name: string
  address: string | null
}

export const useBusinessStore = defineStore('business', () => {
  const business = ref<Business | null>(null)
  const branches = ref<Branch[]>([])
  const businesses = ref<Business[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** All businesses the current user belongs to (active by default). */
  async function fetchBusinesses(includeInactive = false) {
    try {
      const api = useApi()
      const res = await api<{ data: Business[] }>('/v1/businesses', {
        query: includeInactive ? { include_inactive: 1 } : {},
      })
      businesses.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Daftar bisnis belum bisa dimuat. Coba lagi sebentar, ya.'
      businesses.value = []
      return []
    }
  }

  async function createBusiness(form: Omit<BusinessForm, 'id'>): Promise<Business> {
    const api = useApi()
    error.value = null
    try {
      const res = await api<{ data: Business }>('/v1/businesses', { method: 'POST', body: form })
      await fetchBusinesses()
      await useAuthStore().fetchUser()
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Bisnis baru belum bisa dibuat. Coba lagi sebentar, ya.'
      throw e
    }
  }

  async function updateBusinessById(
    id: string,
    data: Partial<Omit<BusinessForm, 'id'> & { tax_id: string | null; status: 'active' | 'inactive' }>,
  ): Promise<Business> {
    const api = useApi()
    error.value = null
    try {
      const res = await api<{ data: Business }>(`/v1/businesses/${id}`, { method: 'PUT', body: data })
      await fetchBusinesses()
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Data bisnis belum bisa disimpan. Coba lagi sebentar, ya.'
      throw e
    }
  }

  /** Soft-deletes (deactivates) a business. Pass `permanent: true` to hard-delete an empty business. */
  async function deactivateBusiness(id: string, permanent = false) {
    const api = useApi()
    error.value = null
    try {
      await api(`/v1/businesses/${id}`, { method: 'DELETE', query: permanent ? { permanent: 1 } : {} })
      await fetchBusinesses()
      await useAuthStore().fetchUser()
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Bisnis belum bisa dinonaktifkan. Coba lagi sebentar, ya.'
      throw e
    }
  }

  /** Switches the active business — every business-scoped page follows automatically. */
  async function switchBusiness(id: string) {
    const api = useApi()
    error.value = null
    try {
      await api(`/v1/businesses/${id}/switch`, { method: 'POST' })
      await useAuthStore().fetchUser()
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Belum bisa beralih bisnis. Coba lagi sebentar, ya.'
      throw e
    }
  }

  async function uploadLogo(id: string, file: File): Promise<Business> {
    const api = useApi()
    error.value = null
    const body = new FormData()
    body.append('file', file)
    try {
      const res = await api<{ data: Business }>(`/v1/businesses/${id}/logo`, { method: 'POST', body })
      if (business.value?.id === id) business.value = res.data
      await fetchBusinesses()
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Logo belum bisa diunggah. Coba lagi sebentar, ya.'
      throw e
    }
  }

  async function fetchBusiness() {
    loading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: Business }>('/v1/business')
      business.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Data usaha belum bisa dimuat. Coba lagi sebentar, ya.'
    } finally {
      loading.value = false
    }
  }

  async function updateBusiness(data: { name: string; tax_id: string | null }): Promise<Business> {
    const api = useApi()
    error.value = null
    try {
      const res = await api<{ data: Business }>('/v1/business', { method: 'PUT', body: data })
      business.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Data usaha belum bisa disimpan. Coba lagi sebentar, ya.'
      throw e
    }
  }

  async function fetchBranches() {
    error.value = null
    try {
      const api = useApi()
      const res = await api<{ data: Branch[] }>('/v1/branches')
      branches.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Daftar cabang belum bisa dimuat. Coba lagi sebentar, ya.'
      branches.value = []
    }
  }

  async function saveBranch(form: BranchForm): Promise<Branch> {
    const api = useApi()
    error.value = null
    const body = { name: form.name, address: form.address ?? null }
    try {
      const res = form.id
        ? await api<{ data: Branch }>(`/v1/branches/${form.id}`, { method: 'PUT', body })
        : await api<{ data: Branch }>('/v1/branches', { method: 'POST', body })
      await fetchBranches()
      return res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Cabang belum bisa disimpan. Coba lagi sebentar, ya.'
      throw e
    }
  }

  async function deleteBranch(id: string) {
    const api = useApi()
    error.value = null
    try {
      await api(`/v1/branches/${id}`, { method: 'DELETE' })
      await fetchBranches()
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Cabang belum bisa dihapus. Coba lagi sebentar, ya.'
      throw e
    }
  }

  return {
    business, branches, businesses, loading, error,
    fetchBusiness, updateBusiness, fetchBranches, saveBranch, deleteBranch,
    fetchBusinesses, createBusiness, updateBusinessById, deactivateBusiness, switchBusiness, uploadLogo,
  }
})
