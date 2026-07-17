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
        <div>
          <h1 class="text-h1 text-foreground">Input Stok Harian</h1>
          <p class="text-small text-muted-foreground mt-0.5">{{ formattedDate }}</p>
        </div>
      </div>

      <!-- Target date -->
      <div class="bg-surface rounded-xl border border-border p-4 space-y-2 shadow-elevation-1">
        <label for="stock-date-input" class="text-small text-muted-foreground block">
          Tanggal stok
        </label>
        <Input
          id="stock-date-input"
          v-model="selectedDate"
          type="date"
          :min="minDate"
          required
          class="w-full"
          aria-label="Tanggal stok"
        />
        <p class="text-small text-muted-foreground/70">
          Ingin menyiapkan stok lebih awal? Pilih tanggal yang diinginkan di sini.
        </p>
      </div>

      <!-- Instruction -->
      <p class="text-body text-muted-foreground -mt-2">
        Masukkan jumlah stok awal untuk setiap menu sebelum toko buka.
      </p>

      <!-- Product rows -->
      <div class="space-y-2">
        <div v-if="store.loading" class="space-y-2">
          <div v-for="i in 5" :key="i" class="skeleton h-[72px] rounded-xl" />
        </div>

        <EmptyState
          v-else-if="items.length === 0"
          :icon="Package"
          size="compact"
          title="Belum Ada Produk Aktif"
          description="Tambahkan produk di katalog agar bisa dicatat stok hariannya"
          class="bg-surface border border-border rounded-xl"
        >
          <NuxtLink to="/catalog" class="text-small text-primary hover:underline">
            Tambah produk di Katalog →
          </NuxtLink>
        </EmptyState>

        <div
          v-for="item in items"
          :key="item.product_id"
          class="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3 hover:border-input transition-colors"
        >
          <!-- Product image -->
          <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.product_name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <Package v-else class="w-5 h-5 text-muted-foreground" :stroke-width="1.5" />
          </div>

          <!-- Product info -->
          <div class="flex-1 min-w-0">
            <p class="text-h3 text-foreground truncate">{{ item.product_name }}</p>
            <div class="flex items-center gap-3 mt-0.5">
              <span v-if="item.price" class="text-caption text-muted-foreground tabular-nums">
                {{ formatCurrency(item.price) }}
              </span>
              <span v-if="item.current_stock !== undefined" class="text-caption text-muted-foreground">
                Stok: <span class="font-medium" :class="item.current_stock <= 5 ? 'text-warning' : 'text-foreground'">{{ item.current_stock }}</span>
              </span>
            </div>
          </div>

          <!-- Qty stepper + manual input -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              @click="decrease(item)"
              :disabled="item.opening_qty <= 0"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-input text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              :aria-label="`Kurangi stok ${item.product_name}`"
            >
              <Minus class="w-3.5 h-3.5" :stroke-width="2" />
            </button>

            <input
              v-model.number="item.opening_qty"
              type="number"
              inputmode="numeric"
              min="0"
              :aria-label="`Jumlah stok ${item.product_name}`"
              class="w-14 h-8 text-center text-h3 font-semibold tabular-nums bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              @input="clampQty(item)"
            />

            <button
              @click="item.opening_qty++"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-input text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              :aria-label="`Tambah stok ${item.product_name}`"
            >
              <Plus class="w-3.5 h-3.5" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>

      <!-- Summary chip -->
      <div v-if="totalItems > 0" class="flex items-center justify-between bg-primary/8 rounded-xl px-4 py-3 border border-primary/20">
        <span class="text-body text-foreground font-medium">Total stok dibuka</span>
        <span class="text-h3 font-bold tabular-nums text-primary">{{ totalItems }} pcs</span>
      </div>

      <!-- Error -->
      <InlineAlert v-if="store.error" variant="destructive">{{ store.error }}</InlineAlert>

      <!-- Desktop save button -->
      <div class="hidden md:block">
        <button
          @click="save"
          :disabled="!canSave || store.loading"
          class="w-full h-12 rounded-lg font-medium text-body transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          :class="canSave
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'"
        >
          <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin" />
          <template v-else>
            <Check class="w-4 h-4" :stroke-width="2.5" />
            Simpan Stok
          </template>
        </button>
      </div>

    </div>

    <!-- Mobile fixed save bar -->
    <div
      class="md:hidden fixed bottom-16 left-0 right-0 z-20 bg-surface border-t border-border px-4 pt-3"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem))"
    >
      <!-- Preview -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-2.5"
      >
        <p class="text-small text-muted-foreground">
          {{ nonZeroCount }} menu · {{ formattedDate }}
        </p>
        <p class="text-body font-semibold tabular-nums text-primary">
          {{ totalItems }} pcs
        </p>
      </div>
      <button
        @click="save"
        :disabled="!canSave || store.loading"
        class="w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-colors"
        :class="canSave
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-muted text-muted-foreground cursor-not-allowed'"
      >
        <Loader2 v-if="store.loading" class="w-4 h-4 animate-spin" />
        <template v-else>
          <Check class="w-4 h-4" :stroke-width="2.5" />
          {{ store.loading ? 'Menyimpan...' : 'Simpan Stok' }}
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['inventory.create'],
})

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Minus, Plus, Check, Loader2, Package } from '@lucide/vue'
import { useDailyStockStore, type ProductForStock } from '~/stores/dailyStock'
import { EmptyState } from '~/components/ui/empty-state'
import { InlineAlert } from '~/components/ui/inline-alert'
import { Input } from '~/components/ui/input'
import { formatRupiah as formatCurrency } from '~/utils'

const route = useRoute()
const router = useRouter()
const store = useDailyStockStore()
const toast = useToast()

// Deep-link from the draft detail page's "Edit" action: jump straight to that
// date instead of the usual next-open-slot default.
const editDate = typeof route.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(route.query.date)
  ? route.query.date
  : null

interface StockItem {
  product_id: string
  product_name: string
  price: number | null
  image_url: string | null
  current_stock: number
  opening_qty: number
}

const items = ref<StockItem[]>([])

// Today is only selectable while it hasn't been opened yet (reopening it would
// reset opening/sold/closing back to zero); otherwise the earliest pickable
// date is tomorrow — pushing the flow forward to future-dated prep.
const minDate = computed(() => {
  if (!store.hasStocks) return store.today
  const tomorrow = new Date(store.today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]!
})

const selectedDate = ref(store.today)

const formattedDate = computed(() =>
  new Date(selectedDate.value).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

const totalItems = computed(() => items.value.reduce((sum, i) => sum + (i.opening_qty || 0), 0))
const nonZeroCount = computed(() => items.value.filter(i => i.opening_qty > 0).length)
const canSave = computed(() => totalItems.value > 0)

function decrease(item: StockItem) {
  if (item.opening_qty > 0) item.opening_qty--
}

function clampQty(item: StockItem) {
  if (!item.opening_qty || item.opening_qty < 0) item.opening_qty = 0
  item.opening_qty = Math.floor(item.opening_qty)
}

async function save() {
  if (!canSave.value) return
  try {
    await store.openDay(items.value.map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      opening_qty: i.opening_qty,
    })), selectedDate.value)
    toast.success('Stok tersimpan', `${totalItems.value} pcs tercatat untuk ${formattedDate.value}.`)
    router.push('/inventory')
  } catch {
    // error shown via store.error
  }
}

// Prefill from any stock already prepped for the chosen date (e.g. re-opening
// a future date that was set up earlier); otherwise every item starts at 0.
async function applyPrefill(date: string) {
  await store.fetchDayDetail(date)
  const byProduct = new Map(store.dayDetail.map(s => [s.product_id, s.opening_qty]))
  items.value.forEach(item => {
    item.opening_qty = byProduct.get(item.product_id) ?? 0
  })
}

watch(selectedDate, (date) => applyPrefill(date))

onMounted(async () => {
  await store.fetchToday()
  selectedDate.value = editDate ?? minDate.value

  await store.fetchProducts()
  items.value = store.products.map((p: ProductForStock) => ({
    product_id: p.id,
    product_name: p.name,
    price: p.price,
    image_url: p.image_url,
    current_stock: p.current_stock,
    opening_qty: 0,
  }))

  await applyPrefill(selectedDate.value)
})
</script>
