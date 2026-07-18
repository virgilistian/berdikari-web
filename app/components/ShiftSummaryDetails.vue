<template>
  <div class="space-y-4">
    <!-- Shift info -->
    <div class="space-y-1.5">
      <p class="text-small text-muted-foreground font-medium">Informasi Shift</p>
      <div class="bg-muted/50 rounded-xl p-3 space-y-1.5">
        <div v-if="businessName" class="flex justify-between text-small">
          <span class="text-muted-foreground">Usaha</span>
          <span class="text-foreground font-medium">{{ businessName }}</span>
        </div>
        <div class="flex justify-between text-small">
          <span class="text-muted-foreground">Kasir</span>
          <span class="text-foreground font-medium">{{ shift.cashier?.name ?? '—' }}</span>
        </div>
        <div class="flex justify-between text-small">
          <span class="text-muted-foreground">Mulai Shift</span>
          <span class="text-foreground">{{ formatDateTime(shift.opened_at) }}</span>
        </div>
        <div v-if="shift.closed_at" class="flex justify-between text-small">
          <span class="text-muted-foreground">Selesai Shift</span>
          <span class="text-foreground">{{ formatDateTime(shift.closed_at) }}</span>
        </div>
        <div v-if="shift.closed_at" class="flex justify-between text-small">
          <span class="text-muted-foreground">Durasi Shift</span>
          <span class="text-foreground font-medium">{{ duration }}</span>
        </div>
      </div>
    </div>

    <!-- Sales summary -->
    <div class="space-y-1.5">
      <p class="text-small text-muted-foreground font-medium">Ringkasan Penjualan</p>
      <div class="grid grid-cols-3 gap-3 bg-muted/50 rounded-xl p-3">
        <div>
          <p class="text-caption text-muted-foreground">Total Penjualan</p>
          <p class="text-body font-semibold tabular-nums">{{ formatRupiah(shift.total_sales) }}</p>
        </div>
        <div>
          <p class="text-caption text-muted-foreground">Transaksi</p>
          <p class="text-body font-semibold tabular-nums">{{ shift.transaction_count }}</p>
        </div>
        <div>
          <p class="text-caption text-muted-foreground">Item Terjual</p>
          <p class="text-body font-semibold tabular-nums">{{ shift.total_items_sold }}</p>
        </div>
      </div>
    </div>

    <!-- Payment summary -->
    <div v-if="paymentMethods.length > 0" class="space-y-1.5">
      <p class="text-small text-muted-foreground font-medium">Rekapitulasi Pembayaran</p>
      <div class="space-y-1.5">
        <div
          v-for="method in paymentMethods"
          :key="method"
          class="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-border/60"
        >
          <span class="text-small text-foreground">{{ paymentMethodLabel(method) }}</span>
          <span class="text-small font-semibold tabular-nums">{{ formatRupiah(shift.payment_breakdown![method]) }}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 bg-muted/50 rounded-xl p-3">
        <div>
          <p class="text-caption text-muted-foreground">Total Tunai</p>
          <p class="text-body font-semibold tabular-nums">{{ formatRupiah(totalCash) }}</p>
        </div>
        <div>
          <p class="text-caption text-muted-foreground">Total Non-Tunai</p>
          <p class="text-body font-semibold tabular-nums">{{ formatRupiah(totalNonCash) }}</p>
        </div>
      </div>
    </div>

    <!-- Cash summary -->
    <div v-if="shift.expected_cash !== null" class="space-y-1.5">
      <p class="text-small text-muted-foreground font-medium">Ringkasan Kas</p>
      <div class="bg-muted/50 rounded-xl p-3 space-y-1.5">
        <div class="flex justify-between text-small">
          <span class="text-muted-foreground">Kas Awal</span>
          <span class="text-foreground tabular-nums">{{ formatRupiah(shift.opening_cash) }}</span>
        </div>
        <div class="flex justify-between text-small">
          <span class="text-muted-foreground">+ Penjualan Tunai</span>
          <span class="text-foreground tabular-nums">{{ formatRupiah(totalCash) }}</span>
        </div>
        <div class="flex justify-between text-small">
          <span class="text-muted-foreground">- Pengeluaran Operasional</span>
          <span class="text-foreground tabular-nums">{{ formatRupiah(shift.total_expenses) }}</span>
        </div>
        <div class="flex justify-between text-small pt-1.5 border-t border-border/60">
          <span class="text-muted-foreground font-medium">Kas Seharusnya</span>
          <span class="text-foreground font-semibold tabular-nums">{{ formatRupiah(shift.expected_cash) }}</span>
        </div>
        <div class="flex justify-between text-small">
          <span class="text-muted-foreground">Kas Aktual</span>
          <span class="text-foreground font-semibold tabular-nums">{{ formatRupiah(shift.closing_cash) }}</span>
        </div>
        <div class="flex justify-between text-small pt-1.5 border-t border-border/60">
          <span class="text-muted-foreground font-medium">Selisih</span>
          <span class="font-bold tabular-nums" :class="diffColorClass(shift.cash_difference)">
            {{ formatSigned(shift.cash_difference) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Operational expenses -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <p class="text-small text-muted-foreground font-medium">Pengeluaran Operasional</p>
        <span class="text-body font-semibold tabular-nums text-destructive">{{ formatRupiah(shift.total_expenses) }}</span>
      </div>
      <p v-if="expenses.length === 0" class="text-small text-muted-foreground">Belum ada pengeluaran dicatat</p>
      <div v-else class="space-y-1.5">
        <div
          v-for="e in expenses"
          :key="e.id"
          class="flex items-center justify-between gap-2 px-3 py-2 bg-surface rounded-lg border border-border/60"
        >
          <div class="min-w-0">
            <p class="text-small text-foreground truncate">{{ e.category }}</p>
            <p v-if="e.note" class="text-caption text-muted-foreground truncate">{{ e.note }}</p>
          </div>
          <span class="text-small font-semibold tabular-nums text-destructive flex-shrink-0">{{ formatRupiah(e.amount) }}</span>
        </div>
      </div>
    </div>

    <!-- Net income -->
    <div class="flex items-center justify-between bg-muted/50 rounded-xl p-4 border-2 border-primary/20">
      <span class="text-body font-semibold text-foreground">Pendapatan Bersih</span>
      <span class="text-h2 font-bold tabular-nums" :class="netIncome >= 0 ? 'text-success' : 'text-destructive'">
        {{ formatRupiah(netIncome) }}
      </span>
    </div>

    <!-- Stock reconciliation -->
    <div v-if="(shift.stock_summary?.length ?? 0) > 0" class="space-y-2">
      <p class="text-small text-muted-foreground font-medium">Stok</p>
      <div class="grid grid-cols-3 gap-3 bg-muted/50 rounded-xl p-3">
        <div>
          <p class="text-caption text-muted-foreground">Stok Awal</p>
          <p class="text-body font-semibold tabular-nums">{{ totalOpening }}</p>
        </div>
        <div>
          <p class="text-caption text-muted-foreground">Terjual</p>
          <p class="text-body font-semibold tabular-nums">{{ totalSold }}</p>
        </div>
        <div>
          <p class="text-caption text-muted-foreground">Sisa Stok</p>
          <p class="text-body font-semibold tabular-nums">{{ totalClosing }}</p>
        </div>
      </div>

      <template v-if="adjustments.length > 0">
        <p class="text-small text-muted-foreground font-medium pt-1">Penyesuaian Stok</p>
        <div
          v-for="a in adjustments"
          :key="a.product_id"
          class="flex items-center justify-between gap-2 px-3 py-2 bg-surface rounded-lg border border-border/60"
        >
          <div class="min-w-0">
            <p class="text-small text-foreground truncate">{{ a.product_name }}</p>
            <p v-if="a.adjustment_note" class="text-caption text-muted-foreground truncate">"{{ a.adjustment_note }}"</p>
          </div>
          <span
            class="text-small font-semibold tabular-nums flex-shrink-0"
            :class="a.adjustment_qty > 0 ? 'text-success' : 'text-destructive'"
          >{{ a.adjustment_qty > 0 ? '+' : '' }}{{ a.adjustment_qty }}</span>
        </div>
      </template>
    </div>

    <!-- Closing notes -->
    <div v-if="shift.closing_note" class="bg-warning/8 border border-warning/20 rounded-xl p-3">
      <p class="text-caption text-muted-foreground mb-0.5">Catatan Penutupan</p>
      <p class="text-small text-foreground italic">"{{ shift.closing_note }}"</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CashierShift } from '~/stores/shift'
import type { FinanceEntry } from '~/stores/finance'
import { formatRupiah, paymentMethodLabel } from '~/utils'

const props = defineProps<{
  shift: CashierShift
  expenses: FinanceEntry[]
  businessName?: string | null
}>()

const netIncome = computed(() => props.shift.net_income ?? (props.shift.total_sales - props.shift.total_expenses))
const totalOpening = computed(() => (props.shift.stock_summary ?? []).reduce((sum, s) => sum + s.opening_qty, 0))
const totalSold = computed(() => (props.shift.stock_summary ?? []).reduce((sum, s) => sum + s.sold_qty, 0))
const totalClosing = computed(() => (props.shift.stock_summary ?? []).reduce((sum, s) => sum + s.closing_qty, 0))
const adjustments = computed(() => (props.shift.stock_summary ?? []).filter(s => s.adjustment_qty !== 0))

const paymentMethods = computed(() => Object.keys(props.shift.payment_breakdown ?? {}))
const totalCash = computed(() => Number(props.shift.payment_breakdown?.cash ?? 0))
const totalNonCash = computed(() => props.shift.total_sales - totalCash.value)

function formatDateTime(datetime: string): string {
  return new Date(datetime).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const duration = computed(() => {
  if (!props.shift.closed_at) return '—'
  const ms = new Date(props.shift.closed_at).getTime() - new Date(props.shift.opened_at).getTime()
  const totalMinutes = Math.max(0, Math.round(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} jam ${minutes} menit`
})

function diffColorClass(value: number | string | null): string {
  const n = Number(value ?? 0)
  if (!n) return 'text-success'
  return n > 0 ? 'text-success' : 'text-destructive'
}

function formatSigned(value: number | null): string {
  if (value === null || value === undefined) return '—'
  const prefix = value > 0 ? '+' : ''
  return prefix + formatRupiah(value)
}
</script>
