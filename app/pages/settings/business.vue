<template>
  <div class="p-4 md:p-6 space-y-5 max-w-lg">
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/settings"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Kembali ke Pengaturan"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </NuxtLink>
      <h1 class="text-h1 text-foreground">Manajemen Bisnis</h1>
    </div>

    <div v-if="store.loading" class="space-y-3">
      <div class="skeleton h-40 rounded-xl" />
      <div class="skeleton h-40 rounded-xl" />
    </div>

    <template v-else>
      <!-- Bisnis Saya (multi-business list) -->
      <div class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden">
        <div class="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
          <h2 class="text-h3 text-foreground">Bisnis Saya</h2>
          <Button size="sm" @click="openCreateBusiness">
            <Plus class="w-4 h-4 mr-1.5" :stroke-width="1.75" />
            Tambah Bisnis
          </Button>
        </div>

        <ul class="divide-y divide-border">
          <li
            v-for="biz in store.businesses"
            :key="biz.id"
            class="px-5 py-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-body text-foreground font-medium truncate">{{ biz.name }}</p>
                <span
                  v-if="biz.status === 'inactive'"
                  class="text-caption px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0"
                >Nonaktif</span>
                <span
                  v-else-if="biz.id === auth.user?.business_id"
                  class="text-caption px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0"
                >Aktif</span>
              </div>
              <p class="text-small text-muted-foreground truncate">
                {{ businessTypeLabel(biz.type) }}<template v-if="biz.code"> · {{ biz.code }}</template>
              </p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                v-if="biz.status === 'active' && biz.id !== auth.user?.business_id"
                @click="selectBusiness(biz.id)"
                :disabled="switchingId === biz.id"
                class="h-9 px-3 rounded-lg text-small font-medium border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
              >
                {{ switchingId === biz.id ? 'Beralih...' : 'Pilih' }}
              </button>
              <button
                v-if="biz.status === 'active'"
                @click="confirmDeactivateBusiness(biz)"
                class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                :aria-label="`Nonaktifkan ${biz.name}`"
              >
                <Ban class="w-4 h-4" :stroke-width="1.75" />
              </button>
              <button
                v-else
                @click="reactivateBusiness(biz.id)"
                class="h-9 px-3 rounded-lg text-small font-medium border border-input bg-background hover:bg-muted transition-colors"
              >
                Aktifkan
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Business profile (currently active business) -->
      <div class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden">
        <div class="px-5 py-4 border-b border-border bg-muted/10">
          <h2 class="text-h3 text-foreground">Profil Usaha Aktif</h2>
        </div>
        <form class="px-5 py-5 space-y-4" @submit.prevent="saveProfile">
          <div class="space-y-1.5">
            <label for="business-name" class="text-small text-foreground font-medium">Nama Usaha</label>
            <Input id="business-name" v-model="profileForm.name" placeholder="Angkringan Berdikari" required :disabled="savingProfile" class="h-11" />
          </div>
          <div class="space-y-1.5">
            <label for="business-type" class="text-small text-foreground font-medium">Jenis Usaha</label>
            <select
              id="business-type"
              v-model="profileForm.type"
              :disabled="savingProfile"
              class="w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option v-for="t in BUSINESS_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label for="business-code" class="text-small text-foreground font-medium">Kode Usaha</label>
            <Input id="business-code" v-model="profileForm.code" placeholder="mis. angkringan-1" :disabled="savingProfile" class="h-11" />
          </div>
          <div class="space-y-1.5">
            <label for="business-address" class="text-small text-foreground font-medium">Alamat (opsional)</label>
            <Input id="business-address" v-model="profileForm.address" placeholder="Jl. Malioboro No. 1" :disabled="savingProfile" class="h-11" />
          </div>
          <div class="space-y-1.5">
            <label for="business-phone" class="text-small text-foreground font-medium">Telepon (opsional)</label>
            <Input id="business-phone" v-model="profileForm.phone" placeholder="08123456789" :disabled="savingProfile" class="h-11" />
          </div>
          <div class="space-y-1.5">
            <label for="business-tax-id" class="text-small text-foreground font-medium">NPWP (opsional)</label>
            <Input id="business-tax-id" v-model="profileForm.tax_id" placeholder="00.000.000.0-000.000" :disabled="savingProfile" class="h-11" />
          </div>

          <BusinessLogoUpload v-if="store.business" :business="store.business" />

          <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>

          <Button type="submit" class="w-full" :disabled="savingProfile">
            <Loader2 v-if="savingProfile" class="w-4 h-4 mr-2 animate-spin" />
            {{ savingProfile ? 'Menyimpan...' : 'Simpan Profil' }}
          </Button>
        </form>
      </div>

      <!-- Branches -->
      <div class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden">
        <div class="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
          <h2 class="text-h3 text-foreground">Cabang</h2>
          <Button size="sm" @click="openCreateBranch">
            <Plus class="w-4 h-4 mr-1.5" :stroke-width="1.75" />
            Tambah Cabang
          </Button>
        </div>

        <EmptyState
          v-if="store.branches.length === 0"
          :icon="Store"
          title="Belum Ada Cabang"
          description="Tambahkan cabang jika usaha Anda memiliki lebih dari satu lokasi."
          size="compact"
        />

        <ul v-else class="divide-y divide-border">
          <li
            v-for="branch in store.branches"
            :key="branch.id"
            class="px-5 py-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <p class="text-body text-foreground font-medium truncate">{{ branch.name }}</p>
              <p v-if="branch.address" class="text-small text-muted-foreground truncate">{{ branch.address }}</p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                @click="openEditBranch(branch)"
                class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                :aria-label="`Ubah ${branch.name}`"
              >
                <Pencil class="w-4 h-4" :stroke-width="1.75" />
              </button>
              <button
                @click="confirmDeleteBranch(branch)"
                class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                :aria-label="`Hapus ${branch.name}`"
              >
                <Trash2 class="w-4 h-4" :stroke-width="1.75" />
              </button>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <!-- Branch form sheet -->
    <Transition name="overlay">
      <div v-if="showBranchForm" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px]" @click="showBranchForm = false" aria-hidden="true" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showBranchForm"
        class="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-[26rem] md:rounded-2xl z-50 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col max-h-[92svh]"
        role="dialog" aria-modal="true"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 class="text-h2 text-foreground">{{ branchForm.id ? 'Ubah Cabang' : 'Cabang Baru' }}</h2>
          <button @click="showBranchForm = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>

        <div class="p-4 space-y-4 overflow-y-auto">
          <div>
            <label class="text-small text-muted-foreground">Nama cabang</label>
            <input v-model="branchForm.name" type="text" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="mis. Cabang Malioboro" />
            <p v-if="branchFormError" class="text-caption text-destructive mt-1">{{ branchFormError }}</p>
          </div>
          <div>
            <label class="text-small text-muted-foreground">Alamat (opsional)</label>
            <input v-model="branchForm.address" type="text" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="Jl. Malioboro No. 1" />
          </div>

          <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>
        </div>

        <div class="p-4 border-t border-border flex-shrink-0">
          <Button class="w-full" :disabled="savingBranch" @click="submitBranch">
            <Loader2 v-if="savingBranch" class="w-4 h-4 mr-2 animate-spin" />
            {{ savingBranch ? 'Menyimpan...' : 'Simpan' }}
          </Button>
        </div>
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>

    <ConfirmDialog
      v-model:open="showDeleteConfirm"
      title="Hapus Cabang Ini?"
      :description="`${deleteTarget?.name ?? ''} akan dihapus dan tidak bisa dikembalikan.`"
      confirm-label="Ya, Hapus"
      cancel-label="Batal"
      :loading="deletingBranch"
      @confirm="doDeleteBranch"
    />

    <!-- New business form sheet -->
    <Transition name="overlay">
      <div v-if="showBusinessForm" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px]" @click="showBusinessForm = false" aria-hidden="true" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showBusinessForm"
        class="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-[26rem] md:rounded-2xl z-50 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col max-h-[92svh]"
        role="dialog" aria-modal="true"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 class="text-h2 text-foreground">Bisnis Baru</h2>
          <button @click="showBusinessForm = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>

        <div class="p-4 space-y-4 overflow-y-auto">
          <div>
            <label class="text-small text-muted-foreground">Nama usaha</label>
            <input v-model="businessForm.name" type="text" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="mis. Kolam Renang Berdikari" />
          </div>
          <div>
            <label class="text-small text-muted-foreground">Jenis usaha</label>
            <select v-model="businessForm.type" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
              <option v-for="t in BUSINESS_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="text-small text-muted-foreground">Kode usaha</label>
            <input v-model="businessForm.code" type="text" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="mis. kolam-1" />
          </div>
          <div>
            <label class="text-small text-muted-foreground">Alamat (opsional)</label>
            <input v-model="businessForm.address" type="text" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="Jl. Malioboro No. 1" />
          </div>
          <div>
            <label class="text-small text-muted-foreground">Telepon (opsional)</label>
            <input v-model="businessForm.phone" type="text" class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" placeholder="08123456789" />
          </div>

          <p v-if="businessFormError" class="text-caption text-destructive">{{ businessFormError }}</p>
          <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>
        </div>

        <div class="p-4 border-t border-border flex-shrink-0">
          <Button class="w-full" :disabled="savingBusinessForm" @click="submitBusinessForm">
            <Loader2 v-if="savingBusinessForm" class="w-4 h-4 mr-2 animate-spin" />
            {{ savingBusinessForm ? 'Menyimpan...' : 'Buat Bisnis' }}
          </Button>
        </div>
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>

    <ConfirmDialog
      v-model:open="showDeactivateConfirm"
      title="Nonaktifkan Bisnis Ini?"
      :description="`${deactivateTarget?.name ?? ''} akan disembunyikan dari daftar bisnis. Data tetap tersimpan dan bisa diaktifkan kembali.`"
      confirm-label="Ya, Nonaktifkan"
      cancel-label="Batal"
      :loading="deactivating"
      @confirm="doDeactivateBusiness"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, X, Store, Ban } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InlineAlert } from '@/components/ui/inline-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import BusinessLogoUpload from '~/components/BusinessLogoUpload.vue'
import { useAuthStore } from '~/stores/auth'
import { useBusinessStore, BUSINESS_TYPES, type Branch, type BranchForm, type Business, type BusinessForm } from '~/stores/business'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['business.manage'],
})

useHead({ title: 'Manajemen Bisnis — Berdikari' })

const store = useBusinessStore()
const auth = useAuthStore()
const toast = useToast()

function businessTypeLabel(type: string | null): string {
  return BUSINESS_TYPES.find(t => t.value === type)?.label ?? 'Lainnya'
}

// ── Business profile (active business) ────────────────────────────────────────
const profileForm = reactive({
  name: '', type: 'other', code: '', address: '' as string | null, phone: '' as string | null,
  tax_id: '' as string | null,
})
const savingProfile = ref(false)

// Keeps the "Profil Usaha Aktif" form in sync whenever the active business
// changes (create/switch/deactivate all refetch store.business).
watch(() => store.business, (biz) => {
  if (!biz) return
  profileForm.name = biz.name
  profileForm.type = biz.type ?? 'other'
  profileForm.code = biz.code ?? ''
  profileForm.address = biz.address
  profileForm.phone = biz.phone
  profileForm.tax_id = biz.tax_id
}, { immediate: true })

onMounted(() => {
  Promise.all([store.fetchBusiness(), store.fetchBranches(), store.fetchBusinesses(true)])
})

async function saveProfile() {
  if (!store.business) return
  savingProfile.value = true
  try {
    await store.updateBusinessById(store.business.id, {
      name: profileForm.name,
      type: profileForm.type,
      code: profileForm.code,
      address: profileForm.address || null,
      phone: profileForm.phone || null,
      tax_id: profileForm.tax_id || null,
    })
    await store.fetchBusiness()
    toast.success('Profil disimpan', 'Data usaha berhasil diperbarui.')
  } catch {
    // error shown via InlineAlert
  } finally {
    savingProfile.value = false
  }
}

// ── Bisnis Saya (multi-business list) ──────────────────────────────────────────
const showBusinessForm = ref(false)
const savingBusinessForm = ref(false)
const businessFormError = ref('')
const businessForm = reactive<Omit<BusinessForm, 'id'>>({ name: '', type: 'other', code: '', address: '', phone: '' })
const switchingId = ref<string | null>(null)

function openCreateBusiness() {
  Object.assign(businessForm, { name: '', type: 'other', code: '', address: '', phone: '' })
  businessFormError.value = ''
  store.error = null
  showBusinessForm.value = true
}

async function submitBusinessForm() {
  businessFormError.value = businessForm.name.trim() && businessForm.code.trim()
    ? ''
    : 'Nama dan kode usaha wajib diisi.'
  if (businessFormError.value) return

  savingBusinessForm.value = true
  try {
    await store.createBusiness({
      name: businessForm.name,
      type: businessForm.type,
      code: businessForm.code,
      address: businessForm.address || null,
      phone: businessForm.phone || null,
    })
    showBusinessForm.value = false
    await Promise.all([store.fetchBusiness(), store.fetchBranches()])
    toast.success('Bisnis dibuat', `${businessForm.name} berhasil ditambahkan dan menjadi bisnis aktif.`)
  } catch {
    // error shown via InlineAlert
  } finally {
    savingBusinessForm.value = false
  }
}

async function selectBusiness(id: string) {
  switchingId.value = id
  try {
    await store.switchBusiness(id)
    await Promise.all([store.fetchBusiness(), store.fetchBranches()])
  } catch (e: any) {
    toast.error('Gagal beralih bisnis', e?.data?.message ?? 'Coba lagi sebentar, ya.')
  } finally {
    switchingId.value = null
  }
}

async function reactivateBusiness(id: string) {
  try {
    await store.updateBusinessById(id, { status: 'active' })
    toast.success('Bisnis diaktifkan', 'Bisnis ini kini aktif kembali dan bisa dipilih.')
  } catch (e: any) {
    toast.error('Gagal mengaktifkan', e?.data?.message ?? 'Coba lagi sebentar, ya.')
  }
}

const showDeactivateConfirm = ref(false)
const deactivating = ref(false)
const deactivateTarget = ref<Business | null>(null)

function confirmDeactivateBusiness(biz: Business) {
  deactivateTarget.value = biz
  showDeactivateConfirm.value = true
}

async function doDeactivateBusiness() {
  if (!deactivateTarget.value) return
  const name = deactivateTarget.value.name
  deactivating.value = true
  try {
    await store.deactivateBusiness(deactivateTarget.value.id)
    await Promise.all([store.fetchBusiness(), store.fetchBranches()])
    toast.success('Bisnis dinonaktifkan', `${name} disembunyikan dari daftar. Bisa diaktifkan kembali kapan saja.`)
  } catch {
    toast.error('Belum bisa menonaktifkan', store.error ?? 'Coba lagi sebentar, ya.')
  } finally {
    deactivating.value = false
    showDeactivateConfirm.value = false
  }
}

// ── Branches ──────────────────────────────────────────────────────────────────
const showBranchForm = ref(false)
const savingBranch = ref(false)
const branchFormError = ref('')
const branchForm = reactive<BranchForm>({ name: '', address: '' })

function openCreateBranch() {
  Object.assign(branchForm, { id: undefined, name: '', address: '' })
  branchFormError.value = ''
  store.error = null
  showBranchForm.value = true
}

function openEditBranch(branch: Branch) {
  Object.assign(branchForm, { id: branch.id, name: branch.name, address: branch.address ?? '' })
  branchFormError.value = ''
  store.error = null
  showBranchForm.value = true
}

async function submitBranch() {
  branchFormError.value = branchForm.name.trim() ? '' : 'Nama cabang wajib diisi.'
  if (branchFormError.value) return
  const isEdit = !!branchForm.id
  savingBranch.value = true
  try {
    await store.saveBranch({ ...branchForm })
    showBranchForm.value = false
    toast.success(isEdit ? 'Cabang diperbarui' : 'Cabang ditambahkan', `${branchForm.name} berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}.`)
  } catch {
    // error shown via InlineAlert
  } finally {
    savingBranch.value = false
  }
}

const showDeleteConfirm = ref(false)
const deletingBranch = ref(false)
const deleteTarget = ref<Branch | null>(null)

function confirmDeleteBranch(branch: Branch) {
  deleteTarget.value = branch
  showDeleteConfirm.value = true
}

async function doDeleteBranch() {
  if (!deleteTarget.value) return
  const name = deleteTarget.value.name
  deletingBranch.value = true
  try {
    await store.deleteBranch(deleteTarget.value.id)
    toast.success('Cabang dihapus', `${name} sudah dihapus.`)
  } catch {
    // error surfaced via toast fallback below
    toast.error('Belum bisa menghapus cabang', store.error ?? 'Coba lagi sebentar, ya.')
  } finally {
    deletingBranch.value = false
    showDeleteConfirm.value = false
  }
}
</script>
