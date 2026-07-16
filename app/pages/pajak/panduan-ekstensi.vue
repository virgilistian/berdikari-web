<script setup lang="ts">
import {
  ArrowLeft, PlugZap, ToggleRight, FolderOpen, ShieldCheck,
  RefreshCw, TriangleAlert, CircleCheck, Download,
} from '@lucide/vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['tax.view'],
})

useHead({ title: 'Panduan Ekstensi SIPADI — Berdikari' })

const router = useRouter()

const steps = [
  {
    title: 'Aktifkan Mode Pengembang',
    icon: ToggleRight,
    items: [
      'Google Chrome: buka chrome://extensions, lalu aktifkan "Developer mode" di pojok kanan atas.',
      'Microsoft Edge: buka edge://extensions, lalu aktifkan "Developer mode" di pojok kiri bawah.',
    ],
  },
  {
    title: 'Pasang Ekstensi',
    icon: FolderOpen,
    download: { label: 'Unduh Ekstensi (.zip)', href: '/downloads/sipadi-autofill-extension.zip' },
    items: [
      'Unduh dan ekstrak (unzip) file di atas ke folder mana saja di komputer Anda.',
      'Klik tombol "Load unpacked" (Muat yang belum dikemas).',
      'Pilih folder sipadi-autofill hasil ekstrak tadi.',
      'Ekstensi "Berdikari SIPADI Autofill" akan muncul di daftar ekstensi.',
    ],
  },
  {
    title: 'Cara Menggunakan',
    icon: PlugZap,
    items: [
      'Buka sipadi.karawangkab.go.id lalu login seperti biasa.',
      'Buka halaman Lapor Pajak untuk objek pajak dan periode yang ingin diisi.',
      'Di tab lain, buka laporan pajak yang sesuai di menu Pajak Berdikari.',
      'Klik tombol "Isi Otomatis SIPADI" — browser akan pindah ke tab SIPADI dan mengisi kolom pendapatan harian.',
      'Periksa kembali semua angka sebelum menekan tombol Kirim di SIPADI — ekstensi tidak pernah mengirim laporan secara otomatis.',
    ],
  },
]

const troubleshooting = [
  { message: 'Ekstensi tidak terdeteksi', solution: 'Ekstensi belum terpasang/aktif. Ulangi langkah "Pasang Ekstensi", lalu muat ulang halaman Berdikari ERP.' },
  { message: 'Tab SIPADI tidak ditemukan', solution: 'Pastikan Anda sudah membuka dan login ke SIPADI di browser yang sama.' },
  { message: 'Masa pajak di SIPADI tidak cocok', solution: 'Buka objek pajak SIPADI untuk bulan dan tahun yang sesuai dengan laporan yang dipilih di Berdikari, lalu coba lagi.' },
  { message: 'Tidak ada tab SIPADI yang menampilkan formulir Lapor Pajak', solution: 'Anda mungkin membuka halaman SIPADI yang bukan formulir Lapor Pajak (misalnya halaman detail objek pajak). Buka formulir Lapor Pajak-nya terlebih dahulu.' },
]
</script>

<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto pb-10 space-y-4">
    <div class="flex items-center gap-2 -ml-1">
      <button
        class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Kembali"
        @click="router.back()"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </button>
      <div>
        <h1 class="text-h1 text-foreground">Panduan Ekstensi SIPADI</h1>
        <p class="text-small text-muted-foreground">Cara memasang & memakai Isi Otomatis SIPADI</p>
      </div>
    </div>

    <!-- Intro -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 p-5 space-y-3">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <PlugZap class="w-5.5 h-5.5 text-primary" :stroke-width="1.75" />
        </div>
        <div>
          <h2 class="text-h3 text-foreground">Apa itu ekstensi ini?</h2>
          <p class="text-small text-muted-foreground mt-1">
            Ekstensi browser yang mengisi formulir Laporan Pajak di SIPADI secara otomatis,
            memakai data dari laporan pajak yang sudah dibuat di Berdikari — jadi Anda tidak
            perlu mengetik ulang data harian satu per satu.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <span class="inline-flex items-center gap-1.5 text-caption font-medium px-2.5 py-1 rounded-full bg-success/15 text-success">
          <CircleCheck class="w-3.5 h-3.5" :stroke-width="2" />
          Tidak pernah kirim otomatis
        </span>
        <span class="inline-flex items-center gap-1.5 text-caption font-medium px-2.5 py-1 rounded-full bg-success/15 text-success">
          <CircleCheck class="w-3.5 h-3.5" :stroke-width="2" />
          Tidak menyimpan kata sandi
        </span>
      </div>
    </div>

    <!-- Steps -->
    <div v-for="(step, index) in steps" :key="step.title" class="bg-surface rounded-xl border border-border shadow-elevation-1 p-5 space-y-3">
      <div class="flex items-center gap-3">
        <span class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-caption font-semibold text-primary flex-shrink-0">
          {{ index + 1 }}
        </span>
        <h2 class="text-h3 text-foreground flex-1">{{ step.title }}</h2>
        <component :is="step.icon" class="w-4.5 h-4.5 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
      </div>
      <div v-if="step.download" class="pl-10">
        <Button as="a" :href="step.download.href" download class="gap-2">
          <Download class="w-4 h-4" :stroke-width="1.75" />
          {{ step.download.label }}
        </Button>
      </div>
      <ul class="space-y-2 pl-10">
        <li v-for="item in step.items" :key="item" class="text-small text-muted-foreground list-disc">
          {{ item }}
        </li>
      </ul>
    </div>

    <!-- Troubleshooting -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 p-5 space-y-3">
      <div class="flex items-center gap-3">
        <TriangleAlert class="w-4.5 h-4.5 text-warning flex-shrink-0" :stroke-width="1.75" />
        <h2 class="text-h3 text-foreground">Jika Muncul Pesan Error</h2>
      </div>
      <div class="divide-y divide-border -mx-5">
        <div v-for="item in troubleshooting" :key="item.message" class="px-5 py-3 space-y-1">
          <p class="text-small font-medium text-foreground">"{{ item.message }}"</p>
          <p class="text-small text-muted-foreground">{{ item.solution }}</p>
        </div>
      </div>
    </div>

    <!-- Update reminder -->
    <div class="bg-surface rounded-xl border border-border shadow-elevation-1 p-5 space-y-2">
      <div class="flex items-center gap-3">
        <RefreshCw class="w-4.5 h-4.5 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
        <h2 class="text-h3 text-foreground">Jika Ekstensi Diperbarui</h2>
      </div>
      <p class="text-small text-muted-foreground">
        Setiap kali ada pembaruan kode ekstensi: buka chrome://extensions (atau edge://extensions),
        klik ikon muat ulang pada kartu "Berdikari SIPADI Autofill", lalu muat ulang tab SIPADI dan
        tab Berdikari ERP yang sedang terbuka. Tanpa langkah ini, browser akan tetap memakai versi
        ekstensi yang lama.
      </p>
    </div>

    <!-- Security -->
    <div class="bg-primary/8 rounded-xl border border-primary/20 p-5 space-y-2">
      <div class="flex items-center gap-3">
        <ShieldCheck class="w-4.5 h-4.5 text-primary flex-shrink-0" :stroke-width="1.75" />
        <h2 class="text-h3 text-foreground">Keamanan</h2>
      </div>
      <ul class="space-y-1.5">
        <li class="text-small text-muted-foreground list-disc ml-4">Ekstensi ini tidak pernah meminta atau menyimpan kata sandi SIPADI Anda.</li>
        <li class="text-small text-muted-foreground list-disc ml-4">Ekstensi ini tidak pernah mengirim (submit) laporan secara otomatis — Anda yang memutuskan kapan laporan dikirim.</li>
        <li class="text-small text-muted-foreground list-disc ml-4">Ekstensi ini hanya aktif di situs Berdikari ERP dan SIPADI, tidak di situs lain.</li>
      </ul>
    </div>
  </div>
</template>
