<template>
  <div>
  <div class="p-4 md:p-6 max-w-lg mx-auto pb-28 md:pb-6 space-y-6">

    <!-- Back + title -->
    <div class="flex items-center gap-2 -ml-1 pt-1">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Kembali"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </button>
      <h1 class="text-h1 text-foreground">Ubah Transaksi</h1>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <div class="skeleton rounded-xl h-32" />
      <div class="skeleton rounded-xl h-20" />
      <div class="skeleton rounded-xl h-40" />
    </div>

    <!-- Not editable (not found / automatic entry) -->
    <EmptyState
      v-else-if="loadError"
      :icon="Wallet"
      title="Transaksi Tidak Dapat Diubah"
      :description="loadError"
      size="compact"
      class="bg-surface rounded-xl border border-border"
    >
      <NuxtLink to="/finance">
        <button class="text-body text-primary font-medium min-h-[44px] flex items-center hover:text-primary/80 transition-colors">
          Kembali ke Keuangan
        </button>
      </NuxtLink>
    </EmptyState>

    <template v-else>

    <!-- Tab switcher -->
    <div class="bg-muted p-1 rounded-xl flex" role="tablist" aria-label="Jenis transaksi">
      <button
        role="tab"
        :aria-selected="formMode === 'expense'"
        @click="formMode = 'expense'"
        class="flex-1 h-10 rounded-lg text-body font-semibold transition-all active:scale-[0.97]"
        :class="formMode === 'expense'
          ? 'bg-destructive text-destructive-foreground shadow-elevation-1'
          : 'text-muted-foreground hover:text-foreground'"
      >
        Pengeluaran
      </button>
      <button
        role="tab"
        :aria-selected="formMode === 'income'"
        @click="formMode = 'income'"
        class="flex-1 h-10 rounded-lg text-body font-semibold transition-all active:scale-[0.97]"
        :class="formMode === 'income'
          ? 'bg-success text-success-foreground shadow-elevation-1'
          : 'text-muted-foreground hover:text-foreground'"
      >
        Pemasukan
      </button>
    </div>

    <!-- Amount input -->
    <div class="bg-surface rounded-xl border border-border p-5 space-y-3 shadow-elevation-1">
      <label for="amount-input" class="text-small text-muted-foreground block">
        {{ formMode === 'expense' ? 'Berapa yang dikeluarkan?' : 'Berapa pemasukannya?' }}
      </label>
      <div class="flex items-baseline gap-2">
        <span class="text-h2 text-muted-foreground font-semibold select-none">Rp</span>
        <input
          :value="displayAmount"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          autocomplete="off"
          class="flex-1 min-w-0 bg-transparent text-display text-foreground font-bold outline-none placeholder:text-foreground/20 tabular-nums caret-primary"
          :aria-label="formMode === 'expense' ? 'Jumlah pengeluaran dalam rupiah' : 'Jumlah pemasukan dalam rupiah'"
          @input="onAmountInput"
        />
      </div>
    </div>

    <!-- Transaction date -->
    <div class="bg-surface rounded-xl border border-border p-5 space-y-2 shadow-elevation-1">
      <label for="transaction-date-input" class="text-small text-muted-foreground block">
        Tanggal transaksi
      </label>
      <Input
        id="transaction-date-input"
        v-model="transactionDate"
        type="date"
        :max="todayDateString"
        required
        class="w-full"
        aria-label="Tanggal transaksi"
      />
    </div>

    <!-- Category selection -->
    <div class="space-y-3">
      <div>
        <h2 class="text-h3 text-foreground">
          {{ formMode === 'expense' ? 'Digunakan untuk apa?' : 'Dari mana pemasukan ini?' }}
        </h2>
        <p class="text-small text-muted-foreground mt-0.5">Pilih satu kategori</p>
      </div>
      <div class="grid grid-cols-2 gap-2" role="group" :aria-label="formMode === 'expense' ? 'Kategori pengeluaran' : 'Kategori pemasukan'">
        <button
          v-for="cat in categoryNames"
          :key="cat"
          @click="category = cat"
          class="h-11 px-3 rounded-lg text-body font-medium text-left transition-all border active:scale-[0.97]"
          :class="category === cat
            ? (formMode === 'expense'
                ? 'bg-primary text-primary-foreground border-primary shadow-elevation-1'
                : 'bg-success text-success-foreground border-success shadow-elevation-1')
            : 'bg-surface text-foreground border-border hover:border-primary/40 hover:bg-accent'"
          :aria-pressed="category === cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Notes -->
    <div class="space-y-2">
      <h2 class="text-h3 text-foreground">
        Catatan
        <span class="text-body text-muted-foreground font-normal ml-1">(opsional)</span>
      </h2>
      <textarea
        v-model="note"
        placeholder="Tambahkan catatan..."
        rows="3"
        class="w-full bg-surface border border-input rounded-lg px-3 py-2.5 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors resize-none"
        aria-label="Catatan transaksi"
      />
    </div>

    <!-- Desktop save button -->
    <div class="hidden md:block">
      <InlineAlert v-if="saveError" variant="destructive" class="mb-2">{{ saveError }}</InlineAlert>
      <button
        @click="save"
        :disabled="!isFormValid || saving"
        class="w-full h-12 rounded-lg font-medium text-body transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        :class="isFormValid
          ? (formMode === 'expense'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
              : 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/80')
          : 'bg-muted text-muted-foreground cursor-not-allowed'"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <template v-else>
          <Check class="w-4 h-4" :stroke-width="2.5" />
          Simpan Perubahan
        </template>
      </button>
    </div>

    </template>

  </div>

  <!-- Mobile fixed save bar -->
  <div
    v-if="!loading && !loadError"
    class="md:hidden fixed bottom-16 left-0 right-0 z-20 bg-surface border-t border-border px-4 pt-3"
    style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem))"
  >
    <InlineAlert v-if="saveError" variant="destructive" class="mb-2.5">{{ saveError }}</InlineAlert>
    <button
      @click="save"
      :disabled="!isFormValid || saving"
      class="w-full h-12 rounded-lg font-medium text-body transition-all flex items-center justify-center gap-2"
      :class="isFormValid
        ? (formMode === 'expense'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98]'
            : 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/80 active:scale-[0.98]')
        : 'bg-muted text-muted-foreground cursor-not-allowed'"
    >
      <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
      <template v-else>
        <Check class="w-4 h-4" :stroke-width="2.5" />
        Simpan Perubahan
      </template>
    </button>
  </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['finance.update'],
})

import { ref, computed, onMounted, watch } from 'vue'
import { ArrowLeft, Check, Loader2, Wallet } from '@lucide/vue'
import { useFinanceStore, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '~/stores/finance'
import { InlineAlert } from '~/components/ui/inline-alert'
import { EmptyState } from '~/components/ui/empty-state'
import { Input } from '~/components/ui/input'

const route = useRoute()
const router = useRouter()
const financeStore = useFinanceStore()
const toast = useToast()

const entryId = String(route.params.id)

const loading = ref(true)
const loadError = ref<string | null>(null)

const categoryNames = computed(() => {
  const custom = financeStore.categories.filter(c => c.type === formMode.value).map(c => c.name)
  if (custom.length) return custom
  return formMode.value === 'expense' ? [...EXPENSE_CATEGORIES] : [...INCOME_CATEGORIES]
})

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const todayDateString = toDateInputValue(new Date())

const formMode = ref<'expense' | 'income'>('expense')
const rawAmount = ref('')
const displayAmount = ref('')
const transactionDate = ref(todayDateString)
const category = ref('')
const note = ref('')
const saving = ref(false)
const saveError = ref<string | null>(null)

const numericAmount = computed(() => {
  const cleaned = rawAmount.value.replace(/[^0-9]/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
})

const isFormValid = computed(() =>
  numericAmount.value > 0 &&
  !!transactionDate.value &&
  transactionDate.value <= todayDateString &&
  category.value !== '',
)

watch(formMode, () => {
  if (!categoryNames.value.includes(category.value)) category.value = ''
})

function onAmountInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  rawAmount.value = digits
  displayAmount.value = digits ? parseInt(digits, 10).toLocaleString('id-ID') : ''
}

onMounted(async () => {
  try {
    await financeStore.fetchCategories()
    const entry = await financeStore.fetchEntry(entryId)

    if (entry.source_type !== 'manual') {
      loadError.value = 'Transaksi otomatis dari penjualan tidak dapat diubah.'
      return
    }

    formMode.value = entry.type
    const amount = Math.round(Number(entry.amount))
    rawAmount.value = String(amount)
    displayAmount.value = amount.toLocaleString('id-ID')
    category.value = entry.category
    note.value = entry.note ?? ''
    transactionDate.value = toDateInputValue(new Date(entry.occurred_at))
  } catch (e: any) {
    loadError.value = e?.data?.message ?? 'Transaksi tidak ditemukan.'
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!isFormValid.value || saving.value) return
  saving.value = true
  saveError.value = null
  try {
    await financeStore.updateEntry(entryId, {
      type: formMode.value,
      amount: numericAmount.value,
      category: category.value,
      note: note.value.trim() || undefined,
      occurred_at: transactionDate.value,
    })
    toast.success('Transaksi diperbarui', `"${category.value}" berhasil disimpan.`)
    router.push('/finance')
  } catch (e: any) {
    saveError.value = e?.data?.message ?? 'Perubahan belum bisa disimpan. Coba lagi sebentar, ya.'
  } finally {
    saving.value = false
  }
}
</script>
