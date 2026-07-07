<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto">
    <!-- Header row -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-h1 text-foreground">Katalog Produk</h1>
      <!-- Desktop add button -->
      <Button class="hidden sm:flex" size="default">
        <Plus class="w-4 h-4" :stroke-width="1.75" />
        Tambah Produk
      </Button>
    </div>

    <!-- Search + filter bar -->
    <div class="flex gap-2 mb-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" :stroke-width="1.75" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari produk..."
          class="w-full h-10 pl-9 pr-4 bg-surface border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          aria-label="Cari produk"
        />
      </div>
      <button
        class="h-10 w-10 flex items-center justify-center rounded-lg border border-input bg-surface text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Filter produk"
      >
        <SlidersHorizontal class="w-4 h-4" :stroke-width="1.75" />
      </button>
    </div>

    <!-- Category tabs -->
    <div class="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1 scrollbar-none" role="list" aria-label="Kategori produk">
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

    <!-- Loading state -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="i in 8" :key="i" class="skeleton rounded-xl aspect-[3/4]" />
    </div>

    <!-- Empty state (no products at all) -->
    <div
      v-else-if="products.length === 0"
      class="flex flex-col items-center text-center gap-4 py-16"
    >
      <div class="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Package class="w-7 h-7 text-muted-foreground" :stroke-width="1.5" />
      </div>
      <div>
        <p class="text-h2 text-foreground">Belum ada produk</p>
        <p class="text-body text-muted-foreground mt-1">Tambahkan produk pertama ke katalog Anda</p>
      </div>
      <Button>
        <Plus class="w-4 h-4" :stroke-width="1.75" />
        Tambah Produk
      </Button>
    </div>

    <!-- Empty search state -->
    <div
      v-else-if="filteredProducts.length === 0"
      class="flex flex-col items-center text-center gap-3 py-14"
    >
      <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <PackageSearch class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
      </div>
      <div>
        <p class="text-h3 text-foreground">Produk tidak ditemukan</p>
        <p class="text-body text-muted-foreground mt-1">Coba kata kunci atau kategori yang berbeda</p>
      </div>
      <button @click="searchQuery = ''; activeCategory = 'Semua'" class="text-body text-primary hover:text-primary/80 min-h-[44px]">
        Hapus filter
      </button>
    </div>

    <!-- Product grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-elevation-2 hover:border-border/60 transition-all duration-150 group"
      >
        <!-- Image area -->
        <div class="aspect-square bg-muted flex items-center justify-center">
          <Package class="w-8 h-8 text-muted-foreground/40" :stroke-width="1.25" />
        </div>
        <!-- Info -->
        <div class="px-3 py-2.5">
          <p class="text-caption text-muted-foreground">{{ product.category }}</p>
          <p class="text-h3 text-foreground mt-0.5 line-clamp-2 leading-tight">{{ product.name }}</p>
          <div class="flex items-center justify-between mt-2">
            <p class="text-body text-primary font-semibold tabular-nums">Rp {{ product.price.toLocaleString('id-ID') }}</p>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              :aria-label="`Opsi ${product.name}`"
            >
              <MoreVertical class="w-4 h-4" :stroke-width="1.75" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile FAB -->
    <div class="sm:hidden fixed bottom-20 right-4 z-10">
      <button
        class="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevation-3 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Tambah produk baru"
      >
        <Plus class="w-6 h-6" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['catalog.view'],
})

import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Package, PackageSearch, SlidersHorizontal, MoreVertical } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const loading = ref(true)
const searchQuery = ref('')
const activeCategory = ref('Semua')

const products = ref([
  { id: 1,  name: 'Nasi Kucing Teri',    price: 3000,  category: 'Nasi'     },
  { id: 2,  name: 'Nasi Kucing Tempe',   price: 3000,  category: 'Nasi'     },
  { id: 3,  name: 'Sate Usus',           price: 2000,  category: 'Sate'     },
  { id: 4,  name: 'Sate Telur Puyuh',    price: 3500,  category: 'Sate'     },
  { id: 5,  name: 'Sate Ayam',           price: 3000,  category: 'Sate'     },
  { id: 6,  name: 'Gorengan Tempe',      price: 1000,  category: 'Gorengan' },
  { id: 7,  name: 'Gorengan Tahu',       price: 1000,  category: 'Gorengan' },
  { id: 8,  name: 'Es Teh Manis',        price: 3000,  category: 'Minuman'  },
  { id: 9,  name: 'Kopi Hitam',          price: 4000,  category: 'Minuman'  },
  { id: 10, name: 'Susu Jahe',           price: 5000,  category: 'Minuman'  },
])

const categories = computed(() => ['Semua', ...new Set(products.value.map(p => p.category))])

const filteredProducts = computed(() => {
  let list = activeCategory.value === 'Semua'
    ? products.value
    : products.value.filter(p => p.category === activeCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  return list
})

onMounted(() => {
  setTimeout(() => { loading.value = false }, 400)
})
</script>
