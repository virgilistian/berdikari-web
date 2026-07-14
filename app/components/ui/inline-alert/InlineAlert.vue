<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CheckCircle2, Info, TriangleAlert } from '@lucide/vue'
import { cn } from '@/utils'

type AlertVariant = 'destructive' | 'success' | 'info'

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant
    title?: string
    class?: HTMLAttributes['class']
  }>(),
  { variant: 'destructive' },
)

const iconByVariant = {
  destructive: TriangleAlert,
  success: CheckCircle2,
  info: Info,
} as const

const styleByVariant: Record<AlertVariant, string> = {
  destructive: 'bg-destructive/10 text-destructive',
  success: 'bg-success/10 text-success',
  info: 'bg-accent text-accent-foreground',
}
</script>

<template>
  <div
    :class="cn('flex items-start gap-2.5 rounded-lg p-3', styleByVariant[props.variant], props.class)"
    role="alert"
  >
    <component :is="iconByVariant[props.variant]" class="h-4 w-4 shrink-0 mt-0.5" :stroke-width="1.75" />
    <div class="min-w-0">
      <p v-if="props.title" class="text-small font-medium">{{ props.title }}</p>
      <p class="text-small" :class="props.title ? 'mt-0.5 opacity-90' : ''"><slot /></p>
    </div>
  </div>
</template>
