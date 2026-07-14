<script setup lang="ts">
import { CheckCircle2, Info, TriangleAlert, X } from '@lucide/vue'
import { cn } from '@/utils'
import type { ToastVariant } from '@/composables/useToast'

const props = defineProps<{
  variant: ToastVariant
  title: string
  description?: string
}>()

defineEmits<{ (e: 'dismiss'): void }>()

const iconByVariant = {
  success: CheckCircle2,
  destructive: TriangleAlert,
  info: Info,
} as const

const styleByVariant: Record<ToastVariant, string> = {
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-accent text-accent-foreground',
}
</script>

<template>
  <div
    class="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-elevation-2"
    role="status"
    aria-live="polite"
  >
    <div :class="cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', styleByVariant[props.variant])">
      <component :is="iconByVariant[props.variant]" class="h-5 w-5" :stroke-width="1.75" />
    </div>
    <div class="min-w-0 flex-1 pt-0.5">
      <p class="text-body font-medium text-foreground">{{ props.title }}</p>
      <p v-if="props.description" class="mt-0.5 text-small text-muted-foreground">{{ props.description }}</p>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Tutup notifikasi"
      @click="$emit('dismiss')"
    >
      <X class="h-4 w-4" :stroke-width="1.75" />
    </button>
  </div>
</template>
