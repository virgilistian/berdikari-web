<template>
  <div class="p-4 md:p-6 space-y-5">
    <!-- Page Header -->
    <div>
      <p class="text-small text-muted-foreground">{{ today }}</p>
      <h1 class="text-h1 text-foreground mt-0.5">Laporan</h1>
    </div>

    <!-- Coming soon card -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 p-8 md:p-12 flex flex-col items-center text-center gap-4">
      <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <BarChart2 class="w-8 h-8 text-primary" :stroke-width="1.5" />
      </div>
      <div class="space-y-1.5 max-w-md">
        <h2 class="text-h2 text-foreground">Laporan Segera Hadir</h2>
        <p class="text-body text-muted-foreground">
          Fitur laporan keuangan, penjualan, dan stok sedang kami siapkan.
          Nantikan ringkasan bisnis Anda dalam satu tampilan.
        </p>
      </div>
      <NuxtLink to="/">
        <Button variant="outline" size="touch">
          <ArrowLeft class="w-4 h-4 mr-2" :stroke-width="1.75" />
          Kembali ke Beranda
        </Button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart2, ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['report.view'],
  title: 'Laporan',
})

useHead({ title: 'Laporan — Berdikari' })

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
</script>
