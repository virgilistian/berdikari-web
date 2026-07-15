<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Sparkles, Printer, RotateCcw, Loader2, Save, FileWarning } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/ui/inline-alert'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { formatRupiah, MONTH_NAMES_ID } from '@/utils'
import { useTaxStore } from '@/stores/tax'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['tax.create'],
})

useHead({ title: 'Buat Pajak — Berdikari' })

const router = useRouter()
const taxStore = useTaxStore()
const auth = useAuthStore()
const toast = useToast()

const selectedType = ref('')
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const generating = ref(false)
const saving = ref(false)
const printing = ref(false)
const showRegenerateConfirm = ref(false)
const showSwitchTypeConfirm = ref(false)
const pendingType = ref('')
const errorMsg = ref('')

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - i)
})

onMounted(async () => {
  await Promise.all([taxStore.fetchBusinessTypes(), taxStore.fetchProfiles()])
  if (taxStore.profiles.length > 0 && !selectedType.value) {
    selectedType.value = taxStore.profiles[0]!.business_type
  }
})

const typeLabel = (type: string) => taxStore.businessTypes.find(t => t.key === type)?.label ?? type

const columns = computed(() => {
  const type = taxStore.currentReport?.business_type ?? selectedType.value
  return taxStore.businessTypes.find(t => t.key === type)?.columns ?? []
})

const canGenerate = computed(() => !!selectedType.value && !generating.value)

async function runGenerate() {
  if (!selectedType.value) return

  generating.value = true
  errorMsg.value = ''
  try {
    await taxStore.generate(selectedType.value, selectedMonth.value, selectedYear.value)
  } catch (e: any) {
    errorMsg.value = e?.data?.message ?? 'Data pajak belum bisa dibuat. Coba lagi sebentar, ya.'
  } finally {
    generating.value = false
  }
}

function confirmRegenerate() {
  showRegenerateConfirm.value = true
}

async function regenerate() {
  showRegenerateConfirm.value = false
  await runGenerate()
}

// Each business type has its own generation rules — switching types while a
// report is already on screen must not silently keep stale data around.
function selectType(type: string) {
  if (type === selectedType.value) return
  if (taxStore.currentReport) {
    pendingType.value = type
    showSwitchTypeConfirm.value = true
  } else {
    selectedType.value = type
  }
}

function confirmSwitchType() {
  selectedType.value = pendingType.value
  taxStore.clearCurrentReport()
  showSwitchTypeConfirm.value = false
}

async function save(finalize = false) {
  if (!taxStore.currentReport) return
  saving.value = true
  errorMsg.value = ''
  try {
    await taxStore.saveReport(taxStore.currentReport.id, finalize)
    toast.success(
      finalize ? 'Laporan disimpan' : 'Perubahan disimpan',
      finalize ? 'Laporan pajak bulan ini sudah final.' : 'Perubahan data berhasil disimpan.',
    )
  } catch (e: any) {
    const msgs = e?.data?.errors
    errorMsg.value = msgs ? Object.values(msgs).flat().join(' ') : (e?.data?.message ?? 'Laporan belum tersimpan. Coba lagi sebentar, ya.')
  } finally {
    saving.value = false
  }
}

async function printPdf() {
  if (!taxStore.currentReport) return
  printing.value = true
  try {
    if (taxStore.currentReport.status === 'draft') {
      await taxStore.saveReport(taxStore.currentReport.id, false)
    }
    await taxStore.printPdf(taxStore.currentReport.id)
  } catch {
    toast.error('Gagal mencetak', 'PDF belum bisa dibuat. Coba lagi sebentar, ya.')
  } finally {
    printing.value = false
  }
}

function onEntryUpdate(dayNumber: number, patch: Record<string, number>) {
  taxStore.updateEntry(dayNumber, patch)
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto pb-28 md:pb-6 space-y-4">
    <div class="flex items-center gap-2 -ml-1">
      <button
        class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Kembali"
        @click="router.back()"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </button>
      <h1 class="text-h1 text-foreground">Buat Pajak</h1>
    </div>

    <EmptyState
      v-if="!taxStore.loading && taxStore.profiles.length === 0"
      :icon="FileWarning"
      title="Profil Pajak Belum Diatur"
      description="Lengkapi NPWPD dan data usaha di Pengaturan &gt; Pajak sebelum membuat laporan."
      class="bg-surface border border-border rounded-xl"
    >
      <NuxtLink to="/settings/pajak" class="text-small text-primary hover:underline">
        Buka Pengaturan Pajak →
      </NuxtLink>
    </EmptyState>

    <template v-else>
      <!-- Business type + month picker -->
      <div class="bg-surface rounded-xl border border-border p-3.5 space-y-3">
        <div v-if="taxStore.profiles.length > 1" class="flex gap-2">
          <button
            v-for="profile in taxStore.profiles"
            :key="profile.business_type"
            class="flex-1 h-10 rounded-lg text-small font-medium border transition-colors"
            :class="selectedType === profile.business_type
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-input hover:border-primary'"
            @click="selectType(profile.business_type)"
          >
            {{ typeLabel(profile.business_type) }}
          </button>
        </div>

        <div class="space-y-1.5">
          <label class="text-h3 text-foreground">Bulan &amp; Tahun</label>
          <div class="grid grid-cols-2 gap-2">
            <select
              v-model.number="selectedMonth"
              aria-label="Pilih bulan"
              class="w-full h-11 px-3 rounded-lg border border-input bg-background text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
            >
              <option v-for="(name, idx) in MONTH_NAMES_ID" :key="name" :value="idx + 1">{{ name }}</option>
            </select>
            <select
              v-model.number="selectedYear"
              aria-label="Pilih tahun"
              class="w-full h-11 px-3 rounded-lg border border-input bg-background text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
            >
              <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
        </div>

        <Button class="w-full gap-2" :disabled="!canGenerate" @click="runGenerate">
          <Loader2 v-if="generating" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" :stroke-width="1.75" />
          {{ generating ? 'Membuat data...' : 'Generate Pajak' }}
        </Button>
      </div>

      <InlineAlert v-if="errorMsg" variant="destructive">{{ errorMsg }}</InlineAlert>

      <template v-if="taxStore.currentReport">
        <!-- Totals summary -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="bg-surface rounded-xl border border-border p-3.5">
            <p class="text-small text-muted-foreground">Total Penjualan</p>
            <p class="text-h2 font-bold text-foreground tabular-nums mt-1">{{ formatRupiah(taxStore.currentReport.total_sales) }}</p>
          </div>
          <div class="bg-primary/8 rounded-xl border border-primary/20 p-3.5">
            <p class="text-small text-muted-foreground">Total Pajak (10%)</p>
            <p class="text-h2 font-bold text-primary tabular-nums mt-1">{{ formatRupiah(taxStore.currentReport.total_tax) }}</p>
          </div>
        </div>

        <InlineAlert v-if="taxStore.currentReport.was_normalized" variant="default">
          Data otomatis disesuaikan agar total pajak tidak melebihi batas bulanan.
        </InlineAlert>

        <!-- Editable entry table -->
        <TaxEntryTable
          :entries="taxStore.currentReport.entries ?? []"
          :columns="columns"
          :readonly="!auth.hasPermission('tax.update')"
          @update="onEntryUpdate"
        />

        <!-- Actions -->
        <div class="hidden md:flex gap-2">
          <Button variant="outline" class="flex-1 gap-2" @click="confirmRegenerate">
            <RotateCcw class="w-4 h-4" :stroke-width="1.75" />
            Generate Ulang
          </Button>
          <Button
            v-if="auth.hasPermission('tax.update')"
            variant="outline"
            class="flex-1 gap-2"
            :disabled="saving"
            @click="save(true)"
          >
            <Save class="w-4 h-4" :stroke-width="1.75" />
            {{ saving ? 'Menyimpan...' : 'Simpan Laporan' }}
          </Button>
          <Button
            v-if="auth.hasPermission('tax.export')"
            class="flex-1 gap-2"
            :disabled="printing"
            @click="printPdf"
          >
            <Printer class="w-4 h-4" :stroke-width="1.75" />
            {{ printing ? 'Menyiapkan...' : 'Cetak PDF' }}
          </Button>
        </div>

        <!-- Mobile fixed action bar -->
        <div
          class="md:hidden fixed bottom-16 left-0 right-0 z-20 bg-surface border-t border-border px-3 pt-3 flex gap-2"
          style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem))"
        >
          <Button
            v-if="auth.hasPermission('tax.export')"
            class="flex-1 gap-2"
            :disabled="printing"
            @click="printPdf"
          >
            <Printer class="w-4 h-4" :stroke-width="1.75" />
            Cetak PDF
          </Button>
          <Button
            v-if="auth.hasPermission('tax.update')"
            variant="outline"
            class="flex-1 gap-2"
            :disabled="saving"
            @click="save(true)"
          >
            <Save class="w-4 h-4" :stroke-width="1.75" />
            Simpan
          </Button>
        </div>
      </template>
    </template>

    <ConfirmDialog
      v-model:open="showRegenerateConfirm"
      title="Generate Ulang Data?"
      description="Data yang sudah diedit di pratinjau ini akan diganti dengan data baru hasil generate."
      variant="destructive"
      confirm-label="Ya, Generate Ulang"
      @confirm="regenerate"
    />

    <ConfirmDialog
      v-model:open="showSwitchTypeConfirm"
      title="Ganti Jenis Usaha?"
      description="Data pajak yang sudah dibuat akan dihapus dari pratinjau ini. Setiap jenis usaha punya aturan generate yang berbeda, jadi Anda perlu generate ulang setelah berpindah."
      variant="destructive"
      confirm-label="Ya, Ganti Jenis Usaha"
      @confirm="confirmSwitchType"
    />
  </div>
</template>
