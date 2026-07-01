<template>
  <div>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

    <!-- Header -->
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Keuangan</h1>
      </div>
      <NuxtLink to="/finance/new" class="hidden sm:block">
        <button
          class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-body font-medium min-h-[44px] hover:bg-primary/90 active:bg-primary/80 transition-colors"
        >
          <Plus class="w-4 h-4" :stroke-width="1.75" />
          Catat Pengeluaran
        </button>
      </NuxtLink>
    </div>

    <!-- Today summary card -->
    <div class="bg-destructive rounded-xl p-5 space-y-1 shadow-elevation-1">
      <p class="text-destructive-foreground/70 text-small">Total keluar hari ini</p>
      <p class="text-display text-destructive-foreground tabular-nums font-bold">
        Rp {{ financeStore.todayTotal.toLocaleString('id-ID') }}
      </p>
      <p class="text-destructive-foreground/70 text-small">
        {{ financeStore.todayExpenses.length }} pengeluaran tercatat
      </p>
    </div>

    <!-- Business balances -->
    <div>
      <h2 class="text-h3 text-foreground mb-3">Saldo Usaha</h2>
      <div class="flex gap-3 overflow-x-auto pb-1 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-none">
        <div
          v-for="biz in financeStore.businesses"
          :key="biz.id"
          class="flex-shrink-0 w-40 bg-surface rounded-xl border border-border p-3.5 shadow-elevation-1"
        >
          <p class="text-caption text-muted-foreground truncate">{{ biz.name }}</p>
          <p class="text-h2 text-foreground font-bold tabular-nums mt-1">
            Rp {{ biz.balance.toLocaleString('id-ID') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Expense history -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-h3 text-foreground">Riwayat Pengeluaran</h2>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1 scrollbar-none" role="list" aria-label="Filter usaha">
        <button
          v-for="tab in filterTabs"
          :key="tab"
          @click="activeFilter = tab"
          class="flex-shrink-0 h-8 px-3 rounded-full text-small font-medium transition-colors"
          :class="activeFilter === tab
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'"
          :aria-pressed="activeFilter === tab"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredExpenses.length === 0"
        class="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center gap-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Wallet class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-h3 text-foreground">Belum ada pengeluaran</p>
          <p class="text-body text-muted-foreground mt-1">Catat pengeluaran pertama hari ini</p>
        </div>
        <NuxtLink to="/finance/new">
          <button class="text-body text-primary font-medium min-h-[44px] flex items-center hover:text-primary/80 transition-colors">
            Catat sekarang
          </button>
        </NuxtLink>
      </div>

      <!-- Expense list -->
      <div
        v-else
        class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
      >
        <div
          v-for="expense in filteredExpenses"
          :key="expense.id"
          class="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft class="w-4 h-4 text-destructive" :stroke-width="1.75" />
            </div>
            <div class="min-w-0">
              <p class="text-body text-foreground font-medium truncate">{{ expense.category }}</p>
              <p class="text-small text-muted-foreground truncate">
                {{ expense.business }}<template v-if="expense.notes"> · {{ expense.notes }}</template>
              </p>
            </div>
          </div>
          <div class="flex flex-col items-end flex-shrink-0 ml-4">
            <p class="text-body text-destructive font-semibold tabular-nums">−Rp {{ expense.amount.toLocaleString('id-ID') }}</p>
            <p class="text-small text-muted-foreground tabular-nums">{{ formatTime(new Date(expense.createdAt)) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile bottom spacer for FAB -->
    <div class="h-6 sm:hidden" aria-hidden="true" />

  </div>

  <!-- Mobile FAB -->
  <div class="sm:hidden fixed bottom-20 right-4 z-10">
    <NuxtLink to="/finance/new">
      <button
        class="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevation-3 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Catat pengeluaran baru"
      >
        <Plus class="w-6 h-6" :stroke-width="2" />
      </button>
    </NuxtLink>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Wallet, ArrowDownLeft } from '@lucide/vue'
import { useFinanceStore } from '~/stores/finance'

const financeStore = useFinanceStore()

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
)

const filterTabs = computed(() => ['Semua', ...financeStore.businesses.map(b => b.name)])
const activeFilter = ref('Semua')

const filteredExpenses = computed(() => {
  if (activeFilter.value === 'Semua') return financeStore.expenses
  return financeStore.expenses.filter(e => e.business === activeFilter.value)
})

function formatTime(date: Date): string {
  const today = new Date().toDateString()
  if (date.toDateString() === today) {
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
  }
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date)
}
</script>
