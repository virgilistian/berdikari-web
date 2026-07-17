<template>
  <div class="p-4 md:p-6 max-w-lg mx-auto space-y-5">

    <!-- Back + title -->
    <div class="flex items-center gap-2 -ml-1 pt-1">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Kembali"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </button>
      <div>
        <p class="text-small text-muted-foreground">{{ formattedDate }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Detail Stok Harian</h1>
      </div>
    </div>

    <!-- ── Loading skeleton ── -->
    <template v-if="store.dayDetailLoading">
      <div class="space-y-2">
        <div v-for="i in 6" :key="i" class="skeleton h-14 rounded-xl" />
      </div>
    </template>

    <!-- ── Empty state: no records for this date ── -->
    <template v-else-if="store.dayDetail.length === 0">
      <EmptyState
        :icon="Boxes"
        title="Tidak Ada Data Stok"
        description="Belum ada catatan stok untuk tanggal ini"
        class="py-20"
      />
    </template>

    <!-- ── Day still a draft: prep for a date that hasn't started yet ── -->
    <template v-else-if="isDraftDay">
      <div class="flex items-center gap-2 bg-warning/10 text-warning rounded-xl px-4 py-3 border border-warning/20">
        <FileClock class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
        <span class="text-body font-medium">Ini masih draf — belum berlaku sampai tanggal tiba.</span>
      </div>

      <div class="rounded-xl border border-border overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-muted/50 border-b border-border">
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground">Menu</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Awal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="s in store.dayDetail" :key="s.id" class="bg-surface">
              <td class="px-4 py-3 text-body text-foreground">{{ s.product_name }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">{{ s.opening_qty }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="canManage" class="flex items-center gap-2">
        <button
          @click="router.push(`/inventory/new?date=${date}`)"
          class="flex-1 h-11 rounded-lg font-medium text-body border border-input text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <Pencil class="w-4 h-4" :stroke-width="1.75" />
          Edit
        </button>
        <button
          @click="confirmDelete = true"
          class="flex-1 h-11 rounded-lg font-medium text-body border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 class="w-4 h-4" :stroke-width="1.75" />
          Hapus
        </button>
      </div>
    </template>

    <!-- ── Day still open: live table ── -->
    <template v-else-if="isOpenDay">
      <div class="rounded-xl border border-border overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-muted/50 border-b border-border">
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground">Menu</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Awal</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Terjual</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Sisa</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="s in store.dayDetail" :key="s.id" class="bg-surface hover:bg-muted/30 transition-colors">
              <td class="px-4 py-3 text-body text-foreground">{{ s.product_name }}</td>
              <td class="px-4 py-3 text-body text-muted-foreground text-right tabular-nums">{{ s.opening_qty }}</td>
              <td
                class="px-4 py-3 text-body text-right tabular-nums"
                :class="s.sold_qty > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'"
              >{{ s.sold_qty }}</td>
              <td
                class="px-4 py-3 text-body font-semibold text-right tabular-nums"
                :class="remaining(s) <= 0 ? 'text-destructive' : 'text-foreground'"
              >{{ remaining(s) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-small text-muted-foreground">Stok akan direkonsiliasi dan ditutup otomatis saat kasir menutup shift.</p>
    </template>

    <!-- ── Day closed: EOD recap ── -->
    <template v-else>
      <div class="flex items-center gap-2 bg-success/10 text-success rounded-xl px-4 py-3 border border-success/20">
        <CheckCircle2 class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
        <span class="text-body font-medium">Hari telah ditutup — Rekap akhir hari</span>
      </div>

      <div class="rounded-xl border border-border overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-muted/50 border-b border-border">
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground">Menu</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Awal</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Terjual</th>
              <th class="px-4 py-3 text-small font-semibold text-muted-foreground text-right">Akhir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="s in store.dayDetail" :key="s.id" class="bg-surface">
              <td class="px-4 py-3 text-body text-foreground">{{ s.product_name }}</td>
              <td class="px-4 py-3 text-body text-muted-foreground text-right tabular-nums">{{ s.opening_qty }}</td>
              <td
                class="px-4 py-3 text-body text-right tabular-nums"
                :class="s.sold_qty > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'"
              >{{ s.sold_qty }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">
                {{ s.closing_qty ?? 0 }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-muted/50 border-t border-border">
              <td class="px-4 py-3 text-body font-semibold text-foreground">Total</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-muted-foreground">{{ totalOpening }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">{{ totalSold }}</td>
              <td class="px-4 py-3 text-body font-semibold text-right tabular-nums text-foreground">{{ totalClosing }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>

    <ConfirmDialog
      v-model:open="confirmDelete"
      title="Hapus Draf Stok Ini?"
      description="Draf stok untuk tanggal ini akan dihapus dan tidak bisa dikembalikan."
      confirm-label="Ya, Hapus"
      cancel-label="Batal"
      :loading="deleting"
      @confirm="doDelete"
    />

  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['inventory.view'],
  validate: (route) => /^\d{4}-\d{2}-\d{2}$/.test(route.params.date as string),
})

import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, Boxes, FileClock, Pencil, Trash2 } from '@lucide/vue'
import { useDailyStockStore, type DailyStockItem } from '~/stores/dailyStock'
import { useAuthStore } from '~/stores/auth'
import { EmptyState } from '~/components/ui/empty-state'
import { InlineAlert } from '~/components/ui/inline-alert'
import { ConfirmDialog } from '~/components/ui/confirm-dialog'

const route = useRoute()
const router = useRouter()
const store = useDailyStockStore()
const auth = useAuthStore()
const toast = useToast()

const date = computed(() => route.params.date as string)

const formattedDate = computed(() =>
  new Date(date.value).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

const isDraftDay = computed(() => store.dayDetail.some(s => s.status === 'draft'))
const isOpenDay = computed(() => store.dayDetail.some(s => s.status === 'open'))
const canManage = computed(() => auth.hasPermission('inventory.create'))

const confirmDelete = ref(false)
const deleting = ref(false)

async function doDelete() {
  deleting.value = true
  try {
    await store.deleteDay(date.value)
    confirmDelete.value = false
    toast.success('Draf dihapus', `Draf stok untuk ${formattedDate.value} sudah dihapus.`)
    router.push('/inventory')
  } catch {
    // error shown via store.error
  } finally {
    deleting.value = false
  }
}

function remaining(s: DailyStockItem) {
  return Math.max(0, s.opening_qty + s.adjustment_qty - s.sold_qty)
}

const totalOpening = computed(() => store.dayDetail.reduce((sum, s) => sum + s.opening_qty, 0))
const totalSold = computed(() => store.dayDetail.reduce((sum, s) => sum + s.sold_qty, 0))
const totalClosing = computed(() => store.dayDetail.reduce((sum, s) => sum + (s.closing_qty ?? 0), 0))

onMounted(() => store.fetchDayDetail(date.value))
</script>
