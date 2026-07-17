<template>
  <div class="space-y-4">
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
    <div class="flex items-center justify-between bg-muted/50 rounded-xl p-4">
      <span class="text-body font-semibold text-foreground">Pendapatan Akhir</span>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CashierShift } from '~/stores/shift'
import type { FinanceEntry } from '~/stores/finance'
import { formatRupiah } from '~/utils'

const props = defineProps<{
  shift: CashierShift
  expenses: FinanceEntry[]
}>()

const netIncome = computed(() => props.shift.net_income ?? (props.shift.total_sales - props.shift.total_expenses))
const totalOpening = computed(() => (props.shift.stock_summary ?? []).reduce((sum, s) => sum + s.opening_qty, 0))
const totalSold = computed(() => (props.shift.stock_summary ?? []).reduce((sum, s) => sum + s.sold_qty, 0))
const totalClosing = computed(() => (props.shift.stock_summary ?? []).reduce((sum, s) => sum + s.closing_qty, 0))
const adjustments = computed(() => (props.shift.stock_summary ?? []).filter(s => s.adjustment_qty !== 0))
</script>
