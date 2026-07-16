<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, FileText, Printer, Receipt, HelpCircle } from '@lucide/vue'
import { InlineAlert } from '@/components/ui/inline-alert'
import { EmptyState } from '@/components/ui/empty-state'
import { formatRupiah, MONTH_NAMES_ID } from '@/utils'
import { useTaxStore } from '@/stores/tax'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['tax.view'],
})

useHead({ title: 'Pajak — Berdikari' })

const taxStore = useTaxStore()
const auth = useAuthStore()

const MONTH_NAMES = MONTH_NAMES_ID

const activeType = ref<string>('')
const activeYear = ref<number>(new Date().getFullYear())
const printingId = ref<string | null>(null)

const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - i)
})

const typeLabel = (type: string) => taxStore.businessTypes.find(t => t.key === type)?.label ?? type

async function load() {
  await taxStore.fetchHistory({
    business_type: activeType.value || undefined,
    period_year: activeYear.value,
  })
}

onMounted(async () => {
  await Promise.all([taxStore.fetchBusinessTypes(), taxStore.fetchProfiles()])
  await load()
})

watch([activeType, activeYear], load)

async function printPdf(id: string) {
  printingId.value = id
  try {
    await taxStore.printPdf(id)
  } finally {
    printingId.value = null
  }
}

function statusLabel(status: string) {
  return status === 'final' ? 'Final' : 'Draf'
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Pajak</h1>
      </div>
      <NuxtLink v-if="auth.hasPermission('tax.create')" to="/pajak/new" class="hidden sm:block">
        <button class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-body font-medium min-h-[44px] hover:bg-primary/90 active:bg-primary/80 transition-colors">
          <Plus class="w-4 h-4" :stroke-width="1.75" />
          Buat Pajak Bulan Ini
        </button>
      </NuxtLink>
    </div>

    <NuxtLink
      v-if="auth.hasPermission('tax.export')"
      to="/pajak/panduan-ekstensi"
      class="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-primary transition-colors"
    >
      <HelpCircle class="w-3.5 h-3.5" :stroke-width="1.75" />
      Panduan pasang ekstensi Isi Otomatis SIPADI
    </NuxtLink>

    <InlineAlert v-if="taxStore.error" variant="destructive">{{ taxStore.error }}</InlineAlert>

    <!-- Filters -->
    <div class="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
      <template v-if="taxStore.profiles.length > 1">
        <button
          v-for="profile in [{ business_type: '' }, ...taxStore.profiles]"
          :key="profile.business_type || 'all'"
          class="flex-shrink-0 h-9 px-3 rounded-full text-small font-medium border transition-colors"
          :class="activeType === profile.business_type
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-surface text-muted-foreground border-border hover:border-primary'"
          @click="activeType = profile.business_type"
        >
          {{ profile.business_type ? typeLabel(profile.business_type) : 'Semua Jenis' }}
        </button>
      </template>

      <select
        v-model.number="activeYear"
        class="flex-shrink-0 h-9 px-3 rounded-full text-small font-medium border border-border bg-surface text-foreground"
      >
        <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
      </select>
    </div>

    <!-- List -->
    <div v-if="taxStore.loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="skeleton h-20 rounded-xl" />
    </div>

    <EmptyState
      v-else-if="taxStore.history.length === 0"
      :icon="Receipt"
      title="Belum Ada Laporan Pajak"
      description="Buat laporan pajak bulanan pertama Anda dengan sekali klik."
      class="bg-surface border border-border rounded-xl"
    >
      <NuxtLink v-if="auth.hasPermission('tax.create')" to="/pajak/new" class="text-small text-primary hover:underline">
        Buat Pajak Sekarang →
      </NuxtLink>
    </EmptyState>

    <div v-else class="space-y-1.5">
      <div
        v-for="report in taxStore.history"
        :key="report.id"
        class="bg-surface rounded-xl border border-border p-3.5 flex items-center justify-between gap-3"
      >
        <NuxtLink :to="`/pajak/${report.id}`" class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-h3 text-foreground">{{ MONTH_NAMES[report.period_month - 1] }} {{ report.period_year }}</p>
            <span
              class="text-caption font-medium px-2 py-0.5 rounded-full"
              :class="report.status === 'final' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'"
            >
              {{ statusLabel(report.status) }}
            </span>
          </div>
          <p class="text-small text-muted-foreground mt-0.5">{{ typeLabel(report.business_type) }} · Pajak {{ formatRupiah(report.total_tax) }}</p>
        </NuxtLink>

        <div class="flex items-center gap-1.5 flex-shrink-0">
          <NuxtLink :to="`/pajak/${report.id}`" class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors" aria-label="Lihat detail">
            <FileText class="w-4 h-4" :stroke-width="1.75" />
          </NuxtLink>
          <button
            v-if="auth.hasPermission('tax.export')"
            class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            :disabled="printingId === report.id"
            aria-label="Cetak PDF"
            @click="printPdf(report.id)"
          >
            <Printer class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile FAB -->
    <NuxtLink
      v-if="auth.hasPermission('tax.create')"
      to="/pajak/new"
      class="sm:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevation-2 flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Buat Pajak Bulan Ini"
    >
      <Plus class="w-6 h-6" :stroke-width="2" />
    </NuxtLink>
  </div>
</template>
