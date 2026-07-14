<script setup lang="ts">
import type { Component } from 'vue'
import { Loader2, TriangleAlert } from '@lucide/vue'
import { buttonVariants } from '@/components/ui/button'
import {
  DrawerContent,
  DrawerFooter,
  DrawerRoot,
} from '@/components/ui/drawer'
import { cn } from '@/utils'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    icon?: Component
    variant?: 'destructive' | 'default'
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
  }>(),
  {
    variant: 'destructive',
    confirmLabel: 'Ya, Lanjutkan',
    cancelLabel: 'Batal',
    loading: false,
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

function cancel() {
  emit('update:open', false)
}
</script>

<template>
  <DrawerRoot :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent>
      <div class="flex flex-col items-center gap-3 px-5 pb-2 pt-3 text-center">
        <div
          :class="cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            props.variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground',
          )"
        >
          <component :is="props.icon ?? TriangleAlert" class="h-6 w-6" :stroke-width="1.75" />
        </div>
        <p class="text-h2 text-foreground">{{ props.title }}</p>
        <p v-if="props.description" class="text-body text-muted-foreground">{{ props.description }}</p>
      </div>

      <DrawerFooter class="flex flex-col gap-2">
        <button
          type="button"
          :disabled="props.loading"
          :class="cn(
            buttonVariants({ variant: props.variant === 'destructive' ? 'destructive' : 'default' }),
            'w-full',
          )"
          @click="emit('confirm')"
        >
          <Loader2 v-if="props.loading" class="h-4 w-4 animate-spin" :stroke-width="2" />
          {{ props.loading ? 'Memproses...' : props.confirmLabel }}
        </button>
        <button
          type="button"
          :disabled="props.loading"
          :class="cn(buttonVariants({ variant: 'outline' }), 'w-full')"
          @click="cancel"
        >
          {{ props.cancelLabel }}
        </button>
      </DrawerFooter>
    </DrawerContent>
  </DrawerRoot>
</template>
