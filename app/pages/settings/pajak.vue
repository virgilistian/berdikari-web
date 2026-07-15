<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ArrowLeft, Loader2, Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTaxStore } from '@/stores/tax'

definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['tax.manage'],
})

useHead({ title: 'Pengaturan Pajak — Berdikari' })

const taxStore = useTaxStore()
const toast = useToast()

interface ProfileForm {
  npwpd: string
  company_name: string
  company_address: string
  owner_name: string
  weekday_price: string
  weekend_price: string
}

const forms = reactive<Record<string, ProfileForm>>({})
const saving = reactive<Record<string, boolean>>({})
const activeTypes = ref<Set<string>>(new Set())
const loading = ref(true)

function blankForm(): ProfileForm {
  return { npwpd: '', company_name: '', company_address: '', owner_name: '', weekday_price: '', weekend_price: '' }
}

onMounted(async () => {
  await Promise.all([taxStore.fetchBusinessTypes(), taxStore.fetchProfiles(), taxStore.fetchAssets()])

  for (const profile of taxStore.profiles) {
    activeTypes.value.add(profile.business_type)
    const overrides = profile.config_overrides?.swimming_pool ?? {}
    forms[profile.business_type] = {
      npwpd: profile.npwpd ?? '',
      company_name: profile.company_name ?? '',
      company_address: profile.company_address ?? '',
      owner_name: profile.owner_name ?? '',
      weekday_price: overrides.weekday_price ? String(overrides.weekday_price) : '',
      weekend_price: overrides.weekend_price ? String(overrides.weekend_price) : '',
    }
  }
  loading.value = false
})

function enableType(type: string) {
  activeTypes.value.add(type)
  if (!forms[type]) forms[type] = blankForm()
}

async function saveProfile(type: string) {
  const form = forms[type]
  if (!form) return

  saving[type] = true
  try {
    const payload: Record<string, unknown> = {
      npwpd: form.npwpd || null,
      company_name: form.company_name || null,
      company_address: form.company_address || null,
      owner_name: form.owner_name || null,
    }

    if (type === 'swimming_pool') {
      const overrides: Record<string, number> = {}
      if (form.weekday_price) overrides.weekday_price = Number(form.weekday_price)
      if (form.weekend_price) overrides.weekend_price = Number(form.weekend_price)
      payload.config_overrides = { swimming_pool: overrides }
    }

    await taxStore.saveProfile(type, payload)
    toast.success('Profil disimpan', 'Data usaha berhasil diperbarui.')
  } catch (e: any) {
    toast.error('Gagal menyimpan', e?.data?.message ?? 'Coba lagi sebentar, ya.')
  } finally {
    saving[type] = false
  }
}

function assetByType(type: 'signature' | 'stamp') {
  return taxStore.assets.find(a => a.type === type)
}
</script>

<template>
  <div class="p-4 md:p-6 space-y-5 max-w-lg">
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/settings"
        class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Kembali ke Pengaturan"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </NuxtLink>
      <h1 class="text-h1 text-foreground">Pengaturan Pajak</h1>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="skeleton h-40 rounded-xl" />
    </div>

    <template v-else>
      <!-- One card per registered business type -->
      <div
        v-for="type in taxStore.businessTypes"
        :key="type.key"
        class="bg-surface rounded-xl border border-border shadow-elevation-1 overflow-hidden"
      >
        <div class="px-5 py-4 border-b border-border bg-muted/10">
          <h2 class="text-h3 text-foreground">{{ type.label }}</h2>
        </div>

        <div v-if="!activeTypes.has(type.key)" class="px-5 py-5 text-center space-y-3">
          <p class="text-small text-muted-foreground">Jenis usaha ini belum diaktifkan untuk pajak.</p>
          <Button variant="outline" class="gap-2" @click="enableType(type.key)">
            <Plus class="w-4 h-4" :stroke-width="1.75" />
            Aktifkan {{ type.label }}
          </Button>
        </div>

        <form v-else class="px-5 py-5 space-y-4" @submit.prevent="saveProfile(type.key)">
          <div class="space-y-1.5">
            <label class="text-small text-foreground font-medium">NPWPD</label>
            <Input v-model="forms[type.key]!.npwpd" placeholder="04001295229004" class="h-11" />
          </div>
          <div class="space-y-1.5">
            <label class="text-small text-foreground font-medium">Nama Perusahaan</label>
            <Input v-model="forms[type.key]!.company_name" placeholder="Rm.Empang Sari Mas" class="h-11" />
          </div>
          <div class="space-y-1.5">
            <label class="text-small text-foreground font-medium">Alamat</label>
            <Input v-model="forms[type.key]!.company_address" placeholder="Jl.Raya Pasar Loji, Karawang" class="h-11" />
          </div>
          <div class="space-y-1.5">
            <label class="text-small text-foreground font-medium">Nama Pemilik</label>
            <Input v-model="forms[type.key]!.owner_name" placeholder="Nama pemilik usaha" class="h-11" />
          </div>

          <template v-if="type.key === 'swimming_pool'">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-small text-foreground font-medium">Harga Tiket Weekday</label>
                <Input v-model="forms[type.key]!.weekday_price" type="number" placeholder="25000" class="h-11" />
              </div>
              <div class="space-y-1.5">
                <label class="text-small text-foreground font-medium">Harga Tiket Weekend</label>
                <Input v-model="forms[type.key]!.weekend_price" type="number" placeholder="35000" class="h-11" />
              </div>
            </div>
          </template>

          <Button type="submit" class="w-full" :disabled="saving[type.key]">
            <Loader2 v-if="saving[type.key]" class="w-4 h-4 mr-2 animate-spin" />
            {{ saving[type.key] ? 'Menyimpan...' : 'Simpan Profil' }}
          </Button>
        </form>
      </div>

      <!-- Signature & stamp, shared across all business types -->
      <div class="bg-surface rounded-xl border border-border shadow-elevation-1 p-5 space-y-4">
        <div>
          <h2 class="text-h3 text-foreground">Tanda Tangan &amp; Stempel</h2>
          <p class="text-small text-muted-foreground mt-0.5">Digunakan di semua laporan PDF pajak untuk usaha ini.</p>
        </div>

        <TaxAssetUpload type="signature" label="Tanda Tangan Pemilik" :asset="assetByType('signature')" />
        <TaxAssetUpload type="stamp" label="Stempel Usaha" :asset="assetByType('stamp')" />
      </div>
    </template>
  </div>
</template>
