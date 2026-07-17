<script setup lang="ts">
import { ref } from 'vue'
import { ImageUp, Trash2, Loader2 } from '@lucide/vue'
import { useTaxStore, type TaxAsset } from '@/stores/tax'

const props = withDefaults(defineProps<{
  type: 'signature' | 'stamp'
  label: string
  asset: TaxAsset | undefined
  maxSizeKb?: number
}>(), {
  maxSizeKb: 512,
})

const taxStore = useTaxStore()
const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const removing = ref(false)

function pickFile() {
  fileInputRef.value?.click()
}

async function onFilePicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return

  const maxSizeBytes = props.maxSizeKb * 1024
  if (file.size > maxSizeBytes) {
    const fileSizeKb = Math.ceil(file.size / 1024)
    toast.error(
      'Ukuran berkas terlalu besar',
      `${props.label} maksimal ${props.maxSizeKb} KB. Berkas Anda ${fileSizeKb} KB.`,
    )
    return
  }

  uploading.value = true
  try {
    await taxStore.uploadAsset(props.type, file)
    toast.success('Berkas diunggah', `${props.label} berhasil diperbarui.`)
  } catch (e: any) {
    toast.error('Gagal mengunggah', e?.data?.message ?? 'Berkas belum bisa diunggah. Coba lagi, ya.')
  } finally {
    uploading.value = false
  }
}

async function removeAsset() {
  removing.value = true
  try {
    await taxStore.removeAsset(props.type)
    toast.success('Berkas dihapus', `${props.label} sudah dihapus dari akun ini.`)
  } catch {
    toast.error('Gagal menghapus', 'Coba lagi sebentar, ya.')
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <label class="text-h3 text-foreground">{{ label }}</label>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/jpg"
      class="hidden"
      @change="onFilePicked"
    >

    <div class="flex items-center gap-3 bg-muted/30 rounded-xl border border-border p-3">
      <div class="w-20 h-20 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img v-if="asset?.data_uri" :src="asset.data_uri" :alt="label" class="w-full h-full object-contain">
        <ImageUp v-else class="w-6 h-6 text-muted-foreground" :stroke-width="1.5" />
      </div>

      <div class="flex-1 min-w-0 space-y-2">
        <p class="text-small text-muted-foreground">
          {{ asset ? 'PNG/JPG diunggah, ukuran disesuaikan otomatis.' : 'Belum ada berkas. Area ini akan kosong di PDF.' }}
        </p>
        <p class="text-small text-muted-foreground">
          Maks. {{ maxSizeKb }} KB. Gunakan PNG dengan latar transparan untuk hasil terbaik.
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="h-9 px-3 rounded-lg text-small font-medium border border-input bg-background hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
            :disabled="uploading"
            @click="pickFile"
          >
            <Loader2 v-if="uploading" class="w-3.5 h-3.5 animate-spin" />
            <ImageUp v-else class="w-3.5 h-3.5" :stroke-width="1.75" />
            {{ asset ? 'Ganti' : 'Unggah' }}
          </button>
          <button
            v-if="asset"
            type="button"
            class="h-9 px-3 rounded-lg text-small font-medium border border-input bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            :disabled="removing"
            @click="removeAsset"
          >
            <Trash2 class="w-3.5 h-3.5" :stroke-width="1.75" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
