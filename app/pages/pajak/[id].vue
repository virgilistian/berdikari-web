<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Printer, Save, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/ui/inline-alert'
import { formatRupiah, MONTH_NAMES_ID } from '@/utils'
import { useTaxStore } from '@/stores/tax'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['tax.view'],
})

useHead({ title: 'Detail Pajak — Berdikari' })

const route = useRoute()
const router = useRouter()
const taxStore = useTaxStore()
const auth = useAuthStore()
const toast = useToast()

const MONTH_NAMES = MONTH_NAMES_ID

const loading = ref(true)
const saving = ref(false)
const printing = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  await Promise.all([taxStore.fetchBusinessTypes(), taxStore.fetchReport(String(route.params.id))])
  loading.value = false
})

const typeLabel = computed(() =>
  taxStore.businessTypes.find(t => t.key === taxStore.currentReport?.business_type)?.label ?? taxStore.currentReport?.business_type,
)

const columns = computed(() =>
  taxStore.businessTypes.find(t => t.key === taxStore.currentReport?.business_type)?.columns ?? [],
)

const monthYearLabel = computed(() => {
  const report = taxStore.currentReport
  if (!report) return ''
  return `${MONTH_NAMES[report.period_month - 1]} ${report.period_year}`
})

function onEntryUpdate(dayNumber: number, patch: Record<string, number>) {
  taxStore.updateEntry(dayNumber, patch)
}

async function save() {
  if (!taxStore.currentReport) return
  saving.value = true
  errorMsg.value = ''
  try {
    await taxStore.saveReport(taxStore.currentReport.id, taxStore.currentReport.status === 'final')
    toast.success('Perubahan disimpan', 'Data laporan pajak berhasil diperbarui.')
  } catch (e: any) {
    const msgs = e?.data?.errors
    errorMsg.value = msgs ? Object.values(msgs).flat().join(' ') : (e?.data?.message ?? 'Perubahan belum tersimpan.')
  } finally {
    saving.value = false
  }
}

async function printPdf() {
  if (!taxStore.currentReport) return
  printing.value = true
  try {
    await taxStore.printPdf(taxStore.currentReport.id)
  } catch {
    toast.error('Gagal mencetak', 'PDF belum bisa dibuat. Coba lagi sebentar, ya.')
  } finally {
    printing.value = false
  }
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
      <div>
        <h1 class="text-h1 text-foreground">{{ monthYearLabel }}</h1>
        <p class="text-small text-muted-foreground">{{ typeLabel }}</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="skeleton h-20 rounded-xl" />
    </div>

    <template v-else-if="taxStore.currentReport">
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

      <InlineAlert v-if="errorMsg" variant="destructive">{{ errorMsg }}</InlineAlert>

      <TaxEntryTable
        :entries="taxStore.currentReport.entries ?? []"
        :columns="columns"
        :readonly="!auth.hasPermission('tax.update')"
        @update="onEntryUpdate"
      />

      <div class="hidden md:flex gap-2">
        <Button
          v-if="auth.hasPermission('tax.update')"
          variant="outline"
          class="flex-1 gap-2"
          :disabled="saving"
          @click="save"
        >
          <Save class="w-4 h-4" :stroke-width="1.75" />
          {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </Button>
        <Button
          v-if="auth.hasPermission('tax.export')"
          class="flex-1 gap-2"
          :disabled="printing"
          @click="printPdf"
        >
          <Printer class="w-4 h-4" :stroke-width="1.75" />
          {{ printing ? 'Menyiapkan...' : 'Cetak Ulang PDF' }}
        </Button>
      </div>

      <div
        class="md:hidden fixed bottom-16 left-0 right-0 z-20 bg-surface border-t border-border px-3 pt-3 flex gap-2"
        style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem))"
      >
        <Button
          v-if="auth.hasPermission('tax.update')"
          variant="outline"
          class="flex-1 gap-2"
          :disabled="saving"
          @click="save"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" :stroke-width="1.75" />
          Simpan
        </Button>
        <Button
          v-if="auth.hasPermission('tax.export')"
          class="flex-1 gap-2"
          :disabled="printing"
          @click="printPdf"
        >
          <Printer class="w-4 h-4" :stroke-width="1.75" />
          Cetak Ulang
        </Button>
      </div>
    </template>
  </div>
</template>
