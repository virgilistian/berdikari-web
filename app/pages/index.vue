<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Selamat datang</h1>
      </div>
      <div
        class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0"
        aria-hidden="true"
      >
        A
      </div>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <template v-if="loadingKpi">
        <div v-for="i in 4" :key="i" class="skeleton h-24 rounded-xl" />
      </template>
      <template v-else>
        <div
          v-for="kpi in kpiCards" :key="kpi.label"
          class="bg-surface rounded-xl border border-border p-4 space-y-1 shadow-elevation-1"
        >
          <div class="flex items-center justify-between">
            <p class="text-caption text-muted-foreground">{{ kpi.label }}</p>
            <component :is="kpi.icon" class="w-4 h-4 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <p class="text-h2 text-foreground font-bold">{{ kpi.value }}</p>
          <p class="text-small flex items-center gap-1" :class="kpi.positive ? 'text-success' : 'text-warning'">
            <TrendingUp v-if="kpi.positive" class="w-3 h-3" />
            <TrendingDown v-else class="w-3 h-3" />
            {{ kpi.change }}
          </p>
        </div>
      </template>
    </div>

    <!-- Quick action -->
    <div class="bg-primary rounded-xl p-5 flex items-center justify-between gap-4">
      <div>
        <p class="text-primary-foreground text-h3">Buka Kasir</p>
        <p class="text-primary-foreground/70 text-small mt-0.5">Mulai transaksi hari ini</p>
      </div>
      <NuxtLink to="/pos">
        <button
          class="flex-shrink-0 bg-surface text-primary font-semibold text-sm px-5 py-2.5 rounded-lg min-h-[44px] hover:bg-surface/90 active:bg-surface/80 transition-colors shadow-elevation-1"
        >
          Buka Kasir
        </button>
      </NuxtLink>
    </div>

    <!-- Recent transactions -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-h3 text-foreground">Transaksi Terbaru</h2>
        <button class="text-small text-primary hover:text-primary/80 transition-colors min-h-[44px] flex items-center">
          Lihat semua
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loadingTransactions" class="space-y-2">
        <div v-for="i in 4" :key="i" class="skeleton h-[60px] rounded-xl" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="recentTransactions.length === 0"
        class="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center gap-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <ShoppingCart class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Belum ada transaksi</p>
          <p class="text-body text-muted-foreground mt-1">Mulai kasir untuk mencatat penjualan pertama hari ini</p>
        </div>
        <NuxtLink to="/pos">
          <button class="text-body text-primary font-medium min-h-[44px] flex items-center hover:text-primary/80 transition-colors">
            Buka kasir sekarang
          </button>
        </NuxtLink>
      </div>

      <!-- Data list -->
      <div
        v-else
        class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
      >
        <div
          v-for="tx in recentTransactions"
          :key="tx.id"
          class="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 class="w-4 h-4 text-success" :stroke-width="1.75" />
            </div>
            <div class="min-w-0">
              <p class="text-body text-foreground font-medium truncate">{{ tx.label }}</p>
              <p class="text-small text-muted-foreground">{{ tx.time }}</p>
            </div>
          </div>
          <p class="text-body text-foreground font-semibold flex-shrink-0 ml-4 tabular-nums">{{ tx.amount }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],  // dashboard: visible to all authenticated users
})

import { ref, computed, onMounted } from 'vue'
import {
  LayoutDashboard, ShoppingCart, Package, TrendingUp, TrendingDown,
  CheckCircle2, Receipt,
} from '@lucide/vue'

const loadingKpi = ref(true)
const loadingTransactions = ref(true)

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
)

const kpiCards = ref([
  { label: 'Penjualan Hari Ini', value: 'Rp 1.250.000', change: '+12% kemarin', positive: true,  icon: TrendingUp },
  { label: 'Transaksi',          value: '48',           change: '+4 dari kemarin', positive: true,  icon: ShoppingCart },
  { label: 'Produk Aktif',       value: '124',          change: '3 hampir habis', positive: false, icon: Package },
  { label: 'Rata-rata Nota',     value: 'Rp 26.000',   change: '+Rp 2.000',     positive: true,  icon: Receipt },
])

const recentTransactions = ref([
  { id: 1, label: '3 item · Meja 5',    time: '14:32', amount: 'Rp 12.500' },
  { id: 2, label: '1 item · Take Away', time: '14:19', amount: 'Rp 5.000'  },
  { id: 3, label: '5 item · Meja 2',    time: '13:55', amount: 'Rp 23.000' },
  { id: 4, label: '2 item · Take Away', time: '13:40', amount: 'Rp 8.000'  },
])

onMounted(() => {
  setTimeout(() => { loadingKpi.value = false }, 400)
  setTimeout(() => { loadingTransactions.value = false }, 600)
})
</script>
