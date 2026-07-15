<script setup lang="ts">
import { computed } from 'vue'
import { formatRupiah } from '@/utils'
import type { TaxReportEntry } from '@/stores/tax'

interface ColumnMeta {
  key: string
  label: string
  editable: boolean
  type: 'number' | 'text' | 'boolean'
}

const props = defineProps<{
  entries: TaxReportEntry[]
  columns: ColumnMeta[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', dayNumber: number, patch: Record<string, number>): void
}>()

// day_number / weekday_name / is_holiday are already rendered in the card
// header — only the remaining columns (Sales, or Qty+Price for the pool
// type) render as data fields. This is what lets one table component
// render both business types' column sets with zero branching here.
const dataColumns = computed(() =>
  props.columns.filter(c => !['day_number', 'weekday_name', 'is_holiday'].includes(c.key)),
)

// Presentation-only distinction: ticket_qty is a plain count, everything
// else numeric on this table is Rupiah.
const CURRENCY_KEYS = new Set(['sales', 'tax', 'ticket_price'])

function rawValue(entry: TaxReportEntry, key: string): number {
  return Number((entry as unknown as Record<string, unknown>)[key] ?? 0)
}

function formatValue(entry: TaxReportEntry, col: ColumnMeta): string {
  const value = rawValue(entry, col.key)
  return CURRENCY_KEYS.has(col.key) ? formatRupiah(value) : value.toLocaleString('id-ID')
}

function onInput(entry: TaxReportEntry, col: ColumnMeta, event: Event) {
  const value = Number((event.target as HTMLInputElement).value) || 0
  emit('update', entry.day_number, { [col.key]: value })
}

// Currency fields get a thousand-separated masked text input (mirrors the
// useRupiahInput pattern used in catalog/pos) instead of a bare number input,
// so whole-rupiah values are never shown with decimals while editing.
function maskedValue(entry: TaxReportEntry, col: ColumnMeta): string {
  return rawValue(entry, col.key).toLocaleString('id-ID')
}

function onMaskedInput(entry: TaxReportEntry, col: ColumnMeta, event: Event) {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/[^0-9]/g, '')
  const value = digits ? parseInt(digits, 10) : 0
  target.value = value.toLocaleString('id-ID')
  emit('update', entry.day_number, { [col.key]: value })
}
</script>

<template>
  <div class="space-y-1.5">
    <div
      v-for="entry in entries"
      :key="entry.day_number"
      class="bg-surface rounded-xl border px-3.5 py-2.5 transition-colors"
      :class="entry.is_holiday ? 'border-warning/40 bg-warning/5' : 'border-border'"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-caption font-semibold text-muted-foreground flex-shrink-0">
            {{ entry.day_number }}
          </span>
          <div>
            <p class="text-h3 text-foreground capitalize">{{ entry.weekday_name }}</p>
            <p v-if="entry.is_holiday" class="text-caption text-warning">{{ entry.holiday_name || 'Libur Nasional' }}</p>
            <p v-else-if="entry.is_weekend" class="text-caption text-muted-foreground">Akhir pekan</p>
          </div>
        </div>
        <span v-if="entry.is_manually_edited" class="text-caption text-primary font-medium">Diedit manual</span>
      </div>

      <div class="grid grid-cols-2 gap-x-2.5 gap-y-1.5">
        <div v-for="col in dataColumns" :key="col.key" class="space-y-0.5">
          <label class="text-caption text-muted-foreground">{{ col.label }}</label>

          <input
            v-if="col.editable && !readonly && CURRENCY_KEYS.has(col.key)"
            type="text"
            inputmode="numeric"
            :value="maskedValue(entry, col)"
            :aria-label="`${col.label} tanggal ${entry.day_number}`"
            class="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-body tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
            @input="onMaskedInput(entry, col, $event)"
          >
          <input
            v-else-if="col.editable && !readonly"
            type="number"
            inputmode="numeric"
            min="0"
            :value="rawValue(entry, col.key)"
            :aria-label="`${col.label} tanggal ${entry.day_number}`"
            class="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-body tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @input="onInput(entry, col, $event)"
          >
          <p v-else class="text-body font-medium tabular-nums text-foreground py-1">
            {{ formatValue(entry, col) }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="entries.length === 0" class="text-center py-10 text-body text-muted-foreground">
      Belum ada data. Buat pajak untuk melihat pratinjau di sini.
    </div>
  </div>
</template>
