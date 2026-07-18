<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto pb-28 md:pb-6 space-y-5">
    <!-- Page Header -->
    <div>
      <p class="text-small text-muted-foreground">{{ today }}</p>
      <h1 class="text-h1 text-foreground mt-0.5">Manajemen Shift</h1>
    </div>

    <!-- Active shift banner -->
    <div v-if="store.activeShift" class="bg-success/10 border border-success/20 rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span class="text-body font-semibold text-success">Shift Aktif</span>
        </div>
        <span class="text-caption text-muted-foreground">{{ formatTime(store.activeShift.opened_at) }}</span>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p class="text-caption text-muted-foreground">Kas Awal</p>
          <p class="text-body font-semibold tabular-nums">{{ formatCurrency(store.activeShift.opening_cash) }}</p>
        </div>
        <div>
          <p class="text-caption text-muted-foreground">Transaksi</p>
          <p class="text-body font-semibold tabular-nums">{{ store.activeShift.transaction_count }}</p>
        </div>
      </div>
      <button
        v-if="auth.hasPermission('pos.close')"
        @click="openCloseWizard"
        class="w-full h-11 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-colors"
      >
        Tutup Shift
      </button>
    </div>

    <!-- Open shift card (no active shift) -->
    <div v-else-if="auth.hasPermission('pos.open')" class="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock class="w-5 h-5 text-primary" :stroke-width="1.75" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Belum Ada Shift Aktif</p>
          <p class="text-small text-muted-foreground">Buka shift untuk mulai menerima transaksi</p>
        </div>
      </div>
      <button
        @click="showOpenForm = true"
        class="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 active:bg-primary/80 transition-colors"
      >
        Buka Shift
      </button>
    </div>

    <!-- Shift history -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-h3 text-foreground">Riwayat Shift</h2>
        <FilterSheet
          v-model="statusFilter"
          title="Filter status shift"
          trigger-label="Status"
          :options="statusOptions"
          default-value="semua"
        />
      </div>

      <div v-if="store.loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="skeleton h-[88px] rounded-xl" />
      </div>

      <EmptyState
        v-else-if="filteredShifts.length === 0"
        :icon="Clock"
        size="compact"
        title="Belum Ada Riwayat Shift"
        description="Riwayat akan muncul di sini setelah kamu membuka shift pertama"
        class="bg-surface border border-border rounded-xl p-10"
      />

      <div v-else class="space-y-2">
        <div
          v-for="shift in filteredShifts"
          :key="shift.id"
          @click="openDetail(shift)"
          class="bg-surface border border-border rounded-xl p-4 shadow-elevation-1 cursor-pointer hover:border-input transition-colors space-y-2"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-body text-foreground font-medium truncate">
                {{ shift.cashier?.name ?? '—' }}
              </p>
              <p class="text-small text-muted-foreground">
                {{ formatTime(shift.opened_at) }}
                <template v-if="shift.closed_at"> → {{ formatTime(shift.closed_at) }}</template>
              </p>
            </div>
            <span
              class="text-caption px-2 py-1 rounded-full flex-shrink-0"
              :class="shift.status === 'open'
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'"
            >
              {{ shift.status === 'open' ? 'Aktif' : 'Selesai' }}
            </span>
          </div>
          <div v-if="shift.status === 'closed'" class="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
            <div>
              <p class="text-caption text-muted-foreground">Penjualan</p>
              <p class="text-small font-semibold tabular-nums text-foreground">{{ formatCurrency(shift.total_sales) }}</p>
            </div>
            <div>
              <p class="text-caption text-muted-foreground">Transaksi</p>
              <p class="text-small font-semibold tabular-nums text-foreground">{{ shift.transaction_count }}</p>
            </div>
            <div>
              <p class="text-caption text-muted-foreground">Selisih Kas</p>
              <p
                class="text-small font-semibold tabular-nums"
                :class="(shift.cash_difference ?? 0) < 0 ? 'text-destructive' : (shift.cash_difference ?? 0) > 0 ? 'text-success' : 'text-foreground'"
              >
                {{ formatDiff(shift.cash_difference) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Open shift drawer -->
    <DrawerRoot v-model:open="showOpenForm">
      <DrawerContent aria-label="Buka shift">
        <DrawerHeader>
          <DrawerTitle>Buka Shift Kasir</DrawerTitle>
        </DrawerHeader>
        <div class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          <p class="text-small text-muted-foreground">
            Masukkan jumlah uang kas awal yang tersedia di laci kasir.
          </p>
          <div>
            <label for="opening-cash" class="text-small text-muted-foreground">
              Kas Awal <span class="text-destructive">*</span>
            </label>
            <input
              id="opening-cash"
              :value="openingCashDisplay" @input="onOpeningCashInput"
              type="text" inputmode="numeric"
              class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              placeholder="0"
            />
          </div>
          <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>
        </div>
        <DrawerFooter>
          <div class="flex w-full gap-2">
            <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="showOpenForm = false">
              Batal
            </button>
            <button
              type="button"
              :class="cn(buttonVariants(), 'flex-1')"
              :disabled="store.loading"
              @click="doOpenShift"
            >
              <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin mr-1" />
              Buka Shift
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>

    <!-- Close shift wizard: stock reconciliation → cash closing → summary -->
    <DrawerRoot v-model:open="showCloseForm">
      <DrawerContent aria-label="Tutup shift">
        <DrawerHeader>
          <DrawerTitle>{{ closeStepTitle }}</DrawerTitle>
        </DrawerHeader>

        <!-- Step 1: stock reconciliation -->
        <template v-if="closeStep === 'stock'">
          <div class="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
            <p class="text-small text-muted-foreground">
              Periksa sisa stok menurut sistem. Sesuaikan jika jumlah fisik berbeda, dan isi alasan penyesuaian.
            </p>
            <div v-if="dailyStockStore.loading" class="space-y-2">
              <div v-for="i in 3" :key="i" class="skeleton h-20 rounded-xl" />
            </div>
            <div v-else-if="dailyStockStore.stocks.length === 0" class="bg-muted/50 rounded-xl p-4 text-small text-muted-foreground">
              Belum ada data stok hari ini. Kamu bisa lanjut menutup shift tanpa rekonsiliasi stok.
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="item in dailyStockStore.stocks"
                :key="item.id"
                class="bg-surface border border-border rounded-xl p-3 space-y-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="text-body font-medium text-foreground truncate">{{ item.product_name }}</p>
                  <span class="text-caption text-muted-foreground flex-shrink-0">
                    Awal {{ item.opening_qty }} · Terjual {{ item.sold_qty }} · Sistem {{ systemRemaining(item) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-small text-muted-foreground flex-shrink-0">Fisik</label>
                  <input
                    v-if="stockAdjustments[item.product_id]"
                    v-model.number="stockAdjustments[item.product_id].physical"
                    type="number" inputmode="numeric" min="0"
                    class="w-20 h-9 text-center text-body font-semibold tabular-nums bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                  />
                </div>
                <Input
                  v-if="stockAdjustments[item.product_id] && stockAdjustments[item.product_id].physical !== systemRemaining(item)"
                  v-model="stockAdjustments[item.product_id].reason"
                  placeholder="Alasan penyesuaian (wajib)"
                  class="h-10"
                />
              </div>
            </div>
            <InlineAlert v-if="dailyStockStore.error" variant="destructive">{{ dailyStockStore.error }}</InlineAlert>
          </div>
          <DrawerFooter>
            <div class="flex w-full gap-2">
              <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="showCloseForm = false">
                Batal
              </button>
              <button
                type="button"
                :class="cn(buttonVariants(), 'flex-1')"
                :disabled="dailyStockStore.loading || stockSubmitting || !stockStepValid"
                @click="submitStockStep"
              >
                <Loader2 v-if="stockSubmitting" class="w-4 h-4 animate-spin mr-1" />
                {{ dailyStockStore.stocks.length === 0 ? 'Lewati' : 'Lanjut' }}
              </button>
            </div>
          </DrawerFooter>
        </template>

        <!-- Step 2: cash closing -->
        <template v-else-if="closeStep === 'cash'">
          <div v-if="store.activeShift" class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
            <!-- Sales summary preview -->
            <div class="bg-muted/50 rounded-xl p-4 space-y-2">
              <p class="text-small text-muted-foreground font-medium">Ringkasan Penjualan</p>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <p class="text-caption text-muted-foreground">Total Penjualan</p>
                  <p class="text-body font-bold tabular-nums text-foreground">{{ formatCurrency(store.activeShift.total_sales) }}</p>
                </div>
                <div>
                  <p class="text-caption text-muted-foreground">Transaksi</p>
                  <p class="text-body font-bold tabular-nums text-foreground">{{ store.activeShift.transaction_count }}</p>
                </div>
                <div>
                  <p class="text-caption text-muted-foreground">Item Terjual</p>
                  <p class="text-body font-bold tabular-nums text-foreground">{{ store.activeShift.total_items_sold }}</p>
                </div>
              </div>
            </div>

            <!-- Payment breakdown -->
            <div v-if="store.activeShift.payment_breakdown" class="space-y-1.5">
              <p class="text-small text-muted-foreground font-medium">Rekapitulasi Pembayaran</p>
              <div
                v-for="(amount, method) in store.activeShift.payment_breakdown"
                :key="method"
                class="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-border/60"
              >
                <span class="text-small text-foreground capitalize">{{ paymentMethodLabel(method) }}</span>
                <span class="text-small font-semibold tabular-nums">{{ formatCurrency(amount) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p class="text-caption text-muted-foreground">Total Tunai</p>
                  <p class="text-small font-semibold tabular-nums">{{ formatCurrency(liveCashSales) }}</p>
                </div>
                <div>
                  <p class="text-caption text-muted-foreground">Total Non-Tunai</p>
                  <p class="text-small font-semibold tabular-nums">{{ formatCurrency(liveNonCashSales) }}</p>
                </div>
              </div>
            </div>

            <!-- Cash summary: Opening + Cash sales - Expenses = Expected -->
            <div class="bg-muted/50 rounded-xl p-4 space-y-1.5">
              <p class="text-small text-muted-foreground font-medium">Ringkasan Kas</p>
              <div class="flex justify-between text-small">
                <span class="text-muted-foreground">Kas Awal</span>
                <span class="text-foreground tabular-nums">{{ formatCurrency(store.activeShift.opening_cash) }}</span>
              </div>
              <div class="flex justify-between text-small">
                <span class="text-muted-foreground">+ Penjualan Tunai</span>
                <span class="text-foreground tabular-nums">{{ formatCurrency(liveCashSales) }}</span>
              </div>
              <div class="flex justify-between text-small">
                <span class="text-muted-foreground">- Pengeluaran Operasional</span>
                <span class="text-foreground tabular-nums">{{ formatCurrency(store.activeShift.total_expenses) }}</span>
              </div>
              <div class="flex justify-between text-small pt-1.5 border-t border-border/60">
                <span class="text-muted-foreground font-medium">Kas Seharusnya</span>
                <span class="text-foreground font-semibold tabular-nums">{{ formatCurrency(expectedCashLive) }}</span>
              </div>
            </div>

            <div>
              <label for="closing-cash" class="text-small text-muted-foreground">
                Kas Aktual Saat Tutup <span class="text-destructive">*</span>
              </label>
              <input
                id="closing-cash"
                :value="closingCashDisplay" @input="onClosingCashInput"
                type="text" inputmode="numeric"
                class="mt-1 w-full h-11 px-3 bg-background border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                placeholder="0"
              />
              <!-- Live difference preview: green when balanced/excess, red when short -->
              <p v-if="closingCash !== null" class="text-small font-semibold mt-1.5" :class="diffColorClass(cashDiff)">
                Selisih: {{ formatDiff(cashDiff) }}
              </p>
            </div>
            <div>
              <label for="closing-note" class="text-small text-muted-foreground">Catatan (opsional)</label>
              <Input
                id="closing-note"
                v-model="closeForm.closing_note"
                class="mt-1 h-11"
                placeholder="Keterangan selisih atau catatan lain..."
              />
            </div>
            <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>
          </div>
          <DrawerFooter>
            <div class="flex w-full gap-2">
              <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="closeStep = 'stock'">
                Kembali
              </button>
              <button
                type="button"
                :class="cn(buttonVariants({ variant: 'destructive' }), 'flex-1')"
                :disabled="store.loading || closingCash === null"
                @click="doCloseShift"
              >
                <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin mr-1" />
                Konfirmasi &amp; Tutup Shift
              </button>
            </div>
          </DrawerFooter>
        </template>

        <!-- Step 3: summary -->
        <template v-else-if="closeStep === 'summary' && closedSummary">
          <div class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
            <div class="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
              <p class="text-small font-semibold text-success">Shift berhasil ditutup</p>
            </div>
            <ShiftSummaryDetails :shift="closedSummary" :expenses="closedExpenses" :business-name="businessName" />
          </div>
          <DrawerFooter>
            <button type="button" :class="cn(buttonVariants(), 'w-full')" @click="finishWizard">
              Selesai
            </button>
          </DrawerFooter>
        </template>
      </DrawerContent>
    </DrawerRoot>

    <!-- Shift detail drawer -->
    <DrawerRoot v-model:open="showDetail">
      <DrawerContent aria-label="Detail shift">
        <DrawerHeader>
          <DrawerTitle>Detail Shift</DrawerTitle>
        </DrawerHeader>
        <div v-if="selectedShift" class="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          <!-- Shift still open: the full report only exists once it's closed -->
          <div v-if="selectedShift.status === 'open'" class="space-y-2">
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Kasir</span>
              <span class="text-foreground font-medium">{{ selectedShift.cashier?.name ?? '—' }}</span>
            </div>
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Buka</span>
              <span class="text-foreground">{{ formatDateTime(selectedShift.opened_at) }}</span>
            </div>
            <div class="flex justify-between text-small">
              <span class="text-muted-foreground">Kas Awal</span>
              <span class="text-foreground font-semibold tabular-nums">{{ formatCurrency(selectedShift.opening_cash) }}</span>
            </div>
          </div>

          <ShiftSummaryDetails
            v-else
            :shift="selectedShift"
            :expenses="detailExpenses"
            :business-name="businessName"
          />
        </div>
        <DrawerFooter>
          <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'w-full')" @click="showDetail = false">
            Tutup
          </button>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  </div>
</template>

<script setup lang="ts">
import { Clock, Loader2 } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { buttonVariants } from '~/components/ui/button'
import { DrawerRoot, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '~/components/ui/drawer'
import { EmptyState } from '~/components/ui/empty-state'
import { InlineAlert } from '~/components/ui/inline-alert'
import { Input } from '~/components/ui/input'
import ShiftSummaryDetails from '~/components/ShiftSummaryDetails.vue'
import { useAuthStore } from '~/stores/auth'
import { useShiftStore, type CashierShift } from '~/stores/shift'
import { useDailyStockStore, type DailyStockItem } from '~/stores/dailyStock'
import { useFinanceStore, type FinanceEntry } from '~/stores/finance'
import { useBusinessStore } from '~/stores/business'
import { cn, paymentMethodLabel } from '~/utils'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['pos.view', 'pos.open', 'pos.close'],
})

const auth = useAuthStore()
const store = useShiftStore()
const dailyStockStore = useDailyStockStore()
const financeStore = useFinanceStore()
const businessStore = useBusinessStore()
const toast = useToast()

const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const showOpenForm = ref(false)
const showCloseForm = ref(false)
const showDetail = ref(false)
const selectedShift = ref<CashierShift | null>(null)
const detailExpenses = ref<FinanceEntry[]>([])
const statusFilter = ref('semua')

const openingCash = ref<number | null>(0)
const { display: openingCashDisplay, onInput: onOpeningCashInput } = useRupiahInput(openingCash)

const closingCash = ref<number | null>(null)
const { display: closingCashDisplay, onInput: onClosingCashInput } = useRupiahInput(closingCash)
const closeForm = ref<{ closing_note: string }>({ closing_note: '' })

/** Close-shift wizard state */
const closeStep = ref<'stock' | 'cash' | 'summary'>('stock')
const stockAdjustments = ref<Record<string, { physical: number; reason: string }>>({})
const stockSubmitting = ref(false)
const closedSummary = ref<CashierShift | null>(null)
const closedExpenses = ref<FinanceEntry[]>([])

const closeStepTitle = computed(() => {
  if (closeStep.value === 'stock') return 'Rekonsiliasi Stok'
  if (closeStep.value === 'summary') return 'Ringkasan Shift'
  return 'Tutup Shift Kasir'
})

const statusOptions = [
  { label: 'Semua', value: 'semua' },
  { label: 'Aktif', value: 'open' },
  { label: 'Selesai', value: 'closed' },
]

const filteredShifts = computed(() => {
  if (statusFilter.value === 'semua') return store.shifts
  return store.shifts.filter(s => s.status === statusFilter.value)
})

const businessName = computed(() =>
  businessStore.businesses.find(b => b.id === auth.user?.business_id)?.name ?? businessStore.businesses[0]?.name
)

const liveCashSales = computed(() => Number(store.activeShift?.payment_breakdown?.cash ?? 0))
const liveNonCashSales = computed(() => Number(store.activeShift?.total_sales ?? 0) - liveCashSales.value)

const expectedCashLive = computed(() => {
  if (!store.activeShift) return 0
  const opening = Number(store.activeShift.opening_cash ?? 0)
  const expenses = Number(store.activeShift.total_expenses ?? 0)
  return opening + liveCashSales.value - expenses
})

const cashDiff = computed(() => {
  if (!store.activeShift || closingCash.value === null) return 0
  return closingCash.value - expectedCashLive.value
})

function diffColorClass(value: number): string {
  if (!value) return 'text-success'
  return value > 0 ? 'text-success' : 'text-destructive'
}

function systemRemaining(item: DailyStockItem): number {
  return item.remaining_qty ?? Math.max(0, item.opening_qty + item.adjustment_qty - item.sold_qty)
}

const stockStepValid = computed(() =>
  dailyStockStore.stocks.every((item) => {
    const adj = stockAdjustments.value[item.product_id]
    if (!adj) return false
    if (adj.physical === systemRemaining(item)) return true
    return adj.reason.trim().length > 0
  })
)

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

function formatDiff(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const prefix = value > 0 ? '+' : ''
  return prefix + new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

function formatTime(datetime: string): string {
  return new Date(datetime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(datetime: string): string {
  return new Date(datetime).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function doOpenShift() {
  try {
    await store.openShift(openingCash.value ?? 0)
    showOpenForm.value = false
    openingCash.value = 0
    await store.fetchShifts()
    toast.success('Shift dibuka', 'Selamat berjualan hari ini!')
  } catch { /* error shown in form */ }
}

async function openCloseWizard() {
  closeStep.value = 'stock'
  closedSummary.value = null
  closedExpenses.value = []
  closingCash.value = null
  closeForm.value = { closing_note: '' }
  await Promise.all([store.fetchActive(), dailyStockStore.fetchToday()])
  const seeded: Record<string, { physical: number; reason: string }> = {}
  for (const item of dailyStockStore.stocks) {
    seeded[item.product_id] = { physical: systemRemaining(item), reason: '' }
  }
  stockAdjustments.value = seeded
  showCloseForm.value = true
}

async function submitStockStep() {
  stockSubmitting.value = true
  try {
    for (const item of dailyStockStore.stocks) {
      const adj = stockAdjustments.value[item.product_id]
      if (!adj) continue
      const delta = adj.physical - systemRemaining(item)
      if (delta !== 0) {
        await dailyStockStore.adjustStock(item.product_id, delta, adj.reason.trim())
      }
    }
    closeStep.value = 'cash'
  } catch { /* error shown via dailyStockStore.error */ }
  finally {
    stockSubmitting.value = false
  }
}

async function doCloseShift() {
  if (!store.activeShift || closingCash.value === null) return
  try {
    const closed = await store.closeShift(store.activeShift.id, {
      closing_cash: closingCash.value,
      closing_note: closeForm.value.closing_note || undefined,
    })
    closedSummary.value = closed
    closedExpenses.value = await financeStore.fetchShiftExpenses(closed.id)
    closingCash.value = null
    closeForm.value = { closing_note: '' }
    await store.fetchShifts()
    closeStep.value = 'summary'
    toast.success('Shift ditutup', 'Kerja bagus hari ini! Ringkasan sudah tersimpan')
  } catch { /* error shown in form */ }
}

function finishWizard() {
  showCloseForm.value = false
  closeStep.value = 'stock'
  closedSummary.value = null
  closedExpenses.value = []
}

async function openDetail(shift: CashierShift) {
  selectedShift.value = shift
  detailExpenses.value = []
  showDetail.value = true
  if (shift.status === 'closed') {
    detailExpenses.value = await financeStore.fetchShiftExpenses(shift.id)
  }
}

onMounted(async () => {
  await Promise.all([store.fetchActive(), store.fetchShifts(), businessStore.fetchBusinesses()])
})
</script>
