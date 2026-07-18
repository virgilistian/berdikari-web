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
              <th v-if="showDevDelete" class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Dev</th>
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
              <td v-if="showDevDelete" class="px-4 py-3 text-right" @click.stop @keydown.enter.stop>
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
                  :aria-label="`Hapus stok harian ${formatRowDate(h.date)} (khusus development)`"
                  @click="openDeleteDialog(h)"
                >
                  <Trash2 class="w-4 h-4" :stroke-width="1.75" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>
    </template>

    <ConfirmDialog
      v-model:open="confirmDelete"
      title="Hapus Stok Harian Ini? (Dev)"
      description="Fitur khusus development. Menghapus data stok harian bisa memengaruhi data shift kasir dan valuasi stok yang terkait tanggal ini. Tindakan ini tidak bisa dibatalkan."
      confirm-label="Ya, Hapus"
      :loading="deleting"
      @confirm="doDelete"
    />

    <ConfirmDialog
      v-model:open="confirmForceDelete"
      title="Hari Ini Sudah Ditutup — Hapus Paksa?"
      description="Valuasi stok dan ringkasan shift kasir kemungkinan sudah memakai data hari ini. Angka yang sudah tersimpan di shift/valuasi tidak akan berubah, tapi riwayat stok harian untuk tanggal ini akan hilang permanen."
      confirm-label="Ya, Hapus Paksa"
      :loading="deleting"
      @confirm="doForceDelete"
    />

  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['inventory.view'],
})

import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Boxes, Trash2 } from '@lucide/vue'
import { useDailyStockStore, type DailyStockHistoryRow } from '~/stores/dailyStock'
import { useAuthStore } from '~/stores/auth'
import { EmptyState } from '~/components/ui/empty-state'
import { InlineAlert } from '~/components/ui/inline-alert'
import { ConfirmDialog } from '~/components/ui/confirm-dialog'

const router = useRouter()
const store = useDailyStockStore()
const auth = useAuthStore()
const toast = useToast()

// Delete is a development-only cleanup tool: hidden whenever the app is
// built for production (import.meta.dev is compiled out of prod bundles),
// and further gated by the same permission that guards draft deletion.
const showDevDelete = computed(() => import.meta.dev && auth.hasPermission('inventory.create'))

const deleteTarget = ref<DailyStockHistoryRow | null>(null)
const confirmDelete = ref(false)
const confirmForceDelete = ref(false)
const deleting = ref(false)

function openDeleteDialog(row: DailyStockHistoryRow) {
  deleteTarget.value = row
  confirmDelete.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  const target = deleteTarget.value
  deleting.value = true
  try {
    await store.deleteDayForDev(target.date)
    confirmDelete.value = false
    deleteTarget.value = null
    toast.success('Stok harian dihapus', `Data stok ${formatRowDate(target.date)} sudah dihapus.`)
  } catch (e: any) {
    if (e?.response?.status === 409) {
      confirmDelete.value = false
      confirmForceDelete.value = true
    }
    // other errors are shown inline via store.error
  } finally {
    deleting.value = false
  }
}

async function doForceDelete() {
  if (!deleteTarget.value) return
  const target = deleteTarget.value
  deleting.value = true
  try {
    await store.deleteDayForDev(target.date, true)
    confirmForceDelete.value = false
    deleteTarget.value = null
    toast.success('Stok harian dihapus', `Data stok ${formatRowDate(target.date)} sudah dihapus paksa.`)
  } catch {
    // error shown inline via store.error
  } finally {
    deleting.value = false
  }
}

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
