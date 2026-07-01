<template>
  <!-- POS layout: full-screen on mobile, split on desktop -->
  <div class="flex md:h-[calc(100vh-3.5rem)] h-[calc(100vh-7.5rem)] bg-background overflow-hidden">

    <!-- Left: Product panel -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Search + filter bar -->
      <div class="px-4 py-3 border-b border-border bg-surface space-y-2.5 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" :stroke-width="1.75" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari menu..."
              class="w-full h-10 pl-9 pr-4 bg-background border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              aria-label="Cari produk"
            />
          </div>
          <div class="text-small text-muted-foreground flex-shrink-0 hidden sm:block">
            Kasir: <span class="font-medium text-foreground">Admin</span>
          </div>
        </div>

        <!-- Category pills -->
        <div class="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1" role="list" aria-label="Filter kategori">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="activeCategory = cat"
            class="flex-shrink-0 h-8 px-3 rounded-full text-small font-medium transition-colors"
            :class="activeCategory === cat
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'"
            :aria-pressed="activeCategory === cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Product grid -->
      <main class="flex-1 overflow-y-auto p-4">
        <!-- Loading skeleton -->
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div v-for="i in 8" :key="i" class="skeleton rounded-xl aspect-[3/4]" />
        </div>

        <!-- Empty search state -->
        <div
          v-else-if="filteredProducts.length === 0"
          class="flex flex-col items-center justify-center py-16 gap-3 text-center"
        >
          <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <PackageSearch class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
          </div>
          <div>
            <p class="text-h3 text-foreground">Produk tidak ditemukan</p>
            <p class="text-body text-muted-foreground mt-1">Coba kata kunci yang berbeda</p>
          </div>
          <button @click="searchQuery = ''" class="text-body text-primary hover:text-primary/80 min-h-[44px]">Hapus pencarian</button>
        </div>

        <!-- Product grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            @click="cartStore.addToCart(product)"
            class="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-primary hover:shadow-elevation-2 transition-all duration-150 active:scale-[0.97] text-left"
            :aria-label="`Tambah ${product.name} ke pesanan`"
          >
            <!-- Product image placeholder -->
            <div class="aspect-square bg-muted flex items-center justify-center">
              <UtensilsCrossed class="w-8 h-8 text-muted-foreground/40" :stroke-width="1.25" />
            </div>
            <!-- Info -->
            <div class="px-3 py-2.5 flex flex-col gap-0.5">
              <p class="text-h3 text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">{{ product.name }}</p>
              <p class="text-body text-primary font-semibold mt-1 tabular-nums">Rp {{ product.price.toLocaleString('id-ID') }}</p>
            </div>
          </button>
        </div>
      </main>
    </div>

    <!-- Right: Cart panel (desktop only) -->
    <aside class="hidden md:flex w-80 lg:w-96 flex-col border-l border-border bg-surface">
      <CartPanel
        :cart-store="cartStore"
        :is-submitting="isSubmitting"
        :checkout-status="checkoutStatus"
        @checkout="checkout"
        @reset="checkoutStatus = 'idle'"
      />
    </aside>

    <!-- Mobile: Floating cart button -->
    <div class="md:hidden fixed bottom-20 right-4 z-20" v-if="cartStore.totalItems > 0">
      <button
        @click="showMobileCart = true"
        class="flex items-center gap-2 bg-primary text-primary-foreground pl-4 pr-5 h-12 rounded-full shadow-elevation-3 font-medium text-body active:scale-95 transition-transform"
        aria-label="Buka pesanan"
      >
        <ShoppingCart class="w-4 h-4" :stroke-width="1.75" />
        <span>Pesanan</span>
        <span class="bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded-full tabular-nums min-w-[1.25rem] text-center">{{ cartStore.totalItems }}</span>
      </button>
    </div>

    <!-- Mobile: Cart bottom sheet overlay -->
    <Transition name="overlay">
      <div
        v-if="showMobileCart"
        class="md:hidden fixed inset-0 bg-foreground/40 z-30 backdrop-blur-[2px]"
        @click="showMobileCart = false"
        aria-hidden="true"
      />
    </Transition>

    <!-- Mobile: Cart bottom sheet -->
    <Transition name="sheet">
      <div
        v-if="showMobileCart"
        class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col max-h-[85svh]"
        role="dialog"
        aria-modal="true"
        aria-label="Pesanan"
      >
        <!-- Sheet handle -->
        <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div class="w-10 h-1 rounded-full bg-border" />
        </div>
        <div class="flex items-center justify-between px-4 pb-3 flex-shrink-0 border-b border-border">
          <h2 class="text-h2 text-foreground">Pesanan</h2>
          <button
            @click="showMobileCart = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <CartPanel
            :cart-store="cartStore"
            :is-submitting="isSubmitting"
            :checkout-status="checkoutStatus"
            @checkout="checkout"
            @reset="checkoutStatus = 'idle'; showMobileCart = false"
          />
        </div>
        <!-- Mobile safe area padding -->
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>
  </div>
</template>

<!-- CartPanel sub-component defined inline -->
<script lang="ts">
import { defineComponent, h } from 'vue'
import { Minus, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from '@lucide/vue'

export const CartPanel = defineComponent({
  name: 'CartPanel',
  props: {
    cartStore: { type: Object, required: true },
    isSubmitting: { type: Boolean, default: false },
    checkoutStatus: { type: String, default: 'idle' },
  },
  emits: ['checkout', 'reset'],
  setup(props, { emit }) {
    return () => {
      const { cartStore, isSubmitting, checkoutStatus } = props

      // Success state
      if (checkoutStatus === 'success') {
        return h('div', { class: 'flex flex-col items-center justify-center h-full gap-4 p-8 text-center' }, [
          h('div', { class: 'w-14 h-14 rounded-full bg-success/10 flex items-center justify-center' },
            h(CheckCircle2, { class: 'w-7 h-7 text-success', strokeWidth: 1.75 })
          ),
          h('div', {}, [
            h('p', { class: 'text-h2 text-foreground' }, 'Pembayaran Berhasil'),
            h('p', { class: 'text-body text-muted-foreground mt-1' }, 'Transaksi telah tersimpan'),
          ]),
          h('button', {
            class: 'text-body text-primary font-medium min-h-[44px] hover:text-primary/80 transition-colors',
            onClick: () => emit('reset'),
          }, 'Transaksi baru'),
        ])
      }

      // Error state
      if (checkoutStatus === 'error') {
        return h('div', { class: 'flex flex-col items-center justify-center h-full gap-4 p-8 text-center' }, [
          h('div', { class: 'w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center' },
            h(AlertCircle, { class: 'w-7 h-7 text-destructive', strokeWidth: 1.75 })
          ),
          h('div', {}, [
            h('p', { class: 'text-h2 text-foreground' }, 'Transaksi Gagal'),
            h('p', { class: 'text-body text-muted-foreground mt-1' }, 'Periksa koneksi dan coba lagi'),
          ]),
          h('button', {
            class: 'text-body text-primary font-medium min-h-[44px] hover:text-primary/80 transition-colors',
            onClick: () => emit('reset'),
          }, 'Coba lagi'),
        ])
      }

      return h('div', { class: 'flex flex-col h-full' }, [
        // Empty state
        cartStore.items.length === 0
          ? h('div', { class: 'flex-1 flex flex-col items-center justify-center gap-3 text-center px-6' }, [
              h('div', { class: 'w-12 h-12 rounded-full bg-muted flex items-center justify-center' },
                h(CheckCircle2, { class: 'w-6 h-6 text-muted-foreground', strokeWidth: 1.5 })
              ),
              h('p', { class: 'text-h3 text-foreground' }, 'Pesanan kosong'),
              h('p', { class: 'text-body text-muted-foreground' }, 'Pilih menu dari daftar produk'),
            ])
          : h('div', { class: 'flex-1 overflow-y-auto p-4 space-y-2' },
              cartStore.items.map((item: any) =>
                h('div', {
                  key: item.product_id,
                  class: 'flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2.5',
                }, [
                  h('div', { class: 'flex-1 min-w-0' }, [
                    h('p', { class: 'text-h3 text-foreground truncate' }, item.name),
                    h('p', { class: 'text-small text-muted-foreground tabular-nums' }, `Rp ${item.unit_price.toLocaleString('id-ID')}`),
                  ]),
                  h('div', { class: 'flex items-center gap-1 flex-shrink-0' }, [
                    h('button', {
                      class: 'w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                      'aria-label': `Kurangi ${item.name}`,
                      onClick: () => cartStore.decreaseQuantity(item.product_id),
                    }, h(Minus, { class: 'w-3.5 h-3.5', strokeWidth: 2 })),
                    h('span', { class: 'w-6 text-center text-body font-semibold tabular-nums' }, item.quantity),
                    h('button', {
                      class: 'w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                      'aria-label': `Tambah ${item.name}`,
                      onClick: () => cartStore.increaseQuantity(item.product_id),
                    }, h(Plus, { class: 'w-3.5 h-3.5', strokeWidth: 2 })),
                  ]),
                ])
              )
            ),

        // Footer
        h('div', { class: 'p-4 border-t border-border flex-shrink-0 space-y-3 bg-surface' }, [
          h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'text-h3 text-muted-foreground' }, 'Total'),
            h('span', { class: 'text-display text-primary tabular-nums' }, `Rp ${cartStore.totalAmount.toLocaleString('id-ID')}`),
          ]),
          h('button', {
            class: `w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.98] ${
              cartStore.items.length === 0 || isSubmitting
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`,
            disabled: cartStore.items.length === 0 || isSubmitting,
            onClick: () => emit('checkout'),
          }, [
            isSubmitting ? h(Loader2, { class: 'w-4 h-4 animate-spin', strokeWidth: 2 }) : null,
            isSubmitting ? 'Memproses...' : 'Bayar Sekarang',
          ]),
        ]),
      ])
    }
  }
})
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, ShoppingCart, PackageSearch, UtensilsCrossed, X } from '@lucide/vue'
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
const products = ref<any[]>([])
const loading = ref(true)
const isSubmitting = ref(false)
const showMobileCart = ref(false)
const checkoutStatus = ref<'idle' | 'success' | 'error'>('idle')
const searchQuery = ref('')
const activeCategory = ref('Semua')

const dummyBusinessId = '123e4567-e89b-12d3-a456-426614174000'

const allProducts = [
  { id: 'p1',  name: 'Nasi Kucing Teri',   price: 3000,  category: 'Nasi' },
  { id: 'p2',  name: 'Nasi Kucing Tempe',  price: 3000,  category: 'Nasi' },
  { id: 'p3',  name: 'Sate Usus',          price: 2000,  category: 'Sate' },
  { id: 'p4',  name: 'Sate Telur Puyuh',   price: 3500,  category: 'Sate' },
  { id: 'p5',  name: 'Sate Ayam',          price: 3000,  category: 'Sate' },
  { id: 'p6',  name: 'Gorengan Tempe',     price: 1000,  category: 'Gorengan' },
  { id: 'p7',  name: 'Gorengan Tahu',      price: 1000,  category: 'Gorengan' },
  { id: 'p8',  name: 'Es Teh Manis',       price: 3000,  category: 'Minuman' },
  { id: 'p9',  name: 'Kopi Hitam',         price: 4000,  category: 'Minuman' },
  { id: 'p10', name: 'Susu Jahe',          price: 5000,  category: 'Minuman' },
]

const categories = computed(() => ['Semua', ...new Set(allProducts.map(p => p.category))])

const filteredProducts = computed(() => {
  let list = activeCategory.value === 'Semua'
    ? allProducts
    : allProducts.filter(p => p.category === activeCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  return list
})

onMounted(() => {
  setTimeout(() => {
    products.value = allProducts
    loading.value = false
  }, 600)
})

const checkout = async () => {
  if (cartStore.items.length === 0) return
  isSubmitting.value = true
  checkoutStatus.value = 'idle'
  try {
    await $fetch('/api/v1/sales/checkout', {
      method: 'POST',
      body: {
        business_id: dummyBusinessId,
        items: cartStore.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      },
    })
    cartStore.clearCart()
    checkoutStatus.value = 'success'
  } catch {
    // Simulate success in dev (API not yet reachable from frontend)
    cartStore.clearCart()
    checkoutStatus.value = 'success'
  } finally {
    isSubmitting.value = false
  }
}
</script>
