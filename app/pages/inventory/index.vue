<template>
  <div class="p-4 md:p-6 max-w-lg mx-auto space-y-5">

    <!-- Header -->
    <div class="flex items-start justify-between pt-1">
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Stok Harian</h1>
      </div>
      <NuxtLink to="/inventory/new">
        <button
          class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-body font-medium min-h-[44px] hover:bg-primary/90 active:bg-primary/80 transition-colors"
        >
          <Plus class="w-4 h-4" :stroke-width="1.75" />
          Tambah Stok Harian
        </button>
      </NuxtLink>
    </div>

    <!-- ── Loading skeleton ── -->
    <template v-if="store.historyLoading">
      <div class="space-y-2">
        <div v-for="i in 6" :key="i" class="skeleton h-16 rounded-xl" />
      </div>
    </template>

    <!-- ── Empty state: no stock history recorded yet ── -->
    <template v-else-if="store.history.length === 0">
      <EmptyState
        :icon="Boxes"
        title="Belum Ada Riwayat Stok"
        description="Catat stok awal hari ini untuk mulai membangun riwayat stok harian"
        class="py-20"
      >
        <NuxtLink to="/inventory/new">
          <button class="flex items-center gap-2 bg-primary text-primary-foreground px-5 h-11 rounded-lg text-body font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors">
            <Plus class="w-4 h-4" :stroke-width="1.75" />
            Tambah Stok Harian
          </button>
        </NuxtLink>
      </EmptyState>
    </template>

    <!-- ── History table ── -->
    <template v-else>
      <div class="rounded-xl border border-border overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-muted/50 border-b border-border">
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground">Tanggal</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Menu</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Awal</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Akhir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr
              v-for="h in store.history"
              :key="h.date"
              tabindex="0"
              role="button"
              :aria-label="`Lihat detail stok ${formatRowDate(h.date)}`"
              class="bg-surface hover:bg-muted/30 focus:bg-muted/30 focus:outline-none cursor-pointer transition-colors"
              @click="goToDay(h.date)"
              @keydown.enter="goToDay(h.date)"
            >
              <td class="px-4 py-3 text-body text-foreground">
                <div class="flex items-center gap-2">
                  <span>{{ formatRowDate(h.date) }}</span>
                  <span
                    class="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                    :class="statusBadgeClass(h.status)"
                  >{{ statusLabel(h.status) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-body text-muted-foreground text-right tabular-nums">{{ h.total_menu_items }}</td>
              <td class="px-4 py-3 text-body text-muted-foreground text-right tabular-nums">{{ h.total_opening_qty }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">{{ h.total_closing_qty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>
    </template>

  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['inventory.view'],
})

import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Boxes } from '@lucide/vue'
import { useDailyStockStore } from '~/stores/dailyStock'
import { EmptyState } from '~/components/ui/empty-state'
import { InlineAlert } from '~/components/ui/inline-alert'

const router = useRouter()
const store = useDailyStockStore()

const formattedDate = computed(() =>
  new Date(store.today ?? new Date()).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

function statusLabel(status: 'draft' | 'open' | 'closed'): string {
  if (status === 'draft') return 'Draf'
  return status === 'open' ? 'Berjalan' : 'Selesai'
}

function statusBadgeClass(status: 'draft' | 'open' | 'closed'): string {
  if (status === 'draft') return 'bg-warning/10 text-warning'
  return status === 'open' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
}

function formatRowDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function goToDay(date: string) {
  router.push(`/inventory/${date}`)
}

onMounted(() => store.fetchHistory())
</script>
