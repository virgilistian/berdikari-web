<script setup lang="ts">
import { ref } from 'vue'
import { ImageUp, Loader2 } from '@lucide/vue'
import { useBusinessStore, type Business } from '@/stores/business'

const props = defineProps<{
  business: Business
}>()

const store = useBusinessStore()
const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function pickFile() {
  fileInputRef.value?.click()
}

async function onFilePicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return

  uploading.value = true
  try {
    await store.uploadLogo(props.business.id, file)
    toast.success('Logo diunggah', 'Logo usaha berhasil diperbarui.')
  } catch (e: any) {
    toast.error('Gagal mengunggah', e?.data?.message ?? 'Logo belum bisa diunggah. Coba lagi, ya.')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <label class="text-small text-foreground font-medium">Logo Usaha (opsional)</label>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/jpg"
      class="hidden"
      @change="onFilePicked"
    >

    <div class="flex items-center gap-3 bg-muted/30 rounded-xl border border-border p-3">
      <div class="w-14 h-14 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img v-if="business.logo_data_uri" :src="business.logo_data_uri" alt="Logo usaha" class="w-full h-full object-contain">
        <ImageUp v-else class="w-5 h-5 text-muted-foreground" :stroke-width="1.5" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-caption text-muted-foreground mb-2">PNG/JPG, maks. 512 KB.</p>
        <button
          type="button"
          class="h-9 px-3 rounded-lg text-small font-medium border border-input bg-background hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
          :disabled="uploading"
          @click="pickFile"
        >
          <Loader2 v-if="uploading" class="w-3.5 h-3.5 animate-spin" />
          <ImageUp v-else class="w-3.5 h-3.5" :stroke-width="1.75" />
          {{ business.logo_data_uri ? 'Ganti Logo' : 'Unggah Logo' }}
        </button>
      </div>
    </div>
  </div>
</template>
