<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { cn } from '@/utils'

withDefaults(
  defineProps<{
    icon: Component
    title: string
    description?: string
    size?: 'default' | 'compact'
    class?: HTMLAttributes['class']
  }>(),
  { size: 'default' },
)
</script>

<template>
  <div
    :class="cn(
      'flex flex-col items-center gap-3 text-center',
      size === 'compact' ? 'py-10' : 'py-16',
      $props.class,
    )"
  >
    <div
      :class="cn(
        'flex items-center justify-center rounded-full bg-muted',
        size === 'compact' ? 'h-12 w-12' : 'h-14 w-14',
      )"
    >
      <component :is="icon" :class="size === 'compact' ? 'h-6 w-6' : 'h-7 w-7'" class="text-muted-foreground" :stroke-width="1.5" />
    </div>
    <div>
      <p :class="size === 'compact' ? 'text-h3' : 'text-h2'" class="text-foreground">{{ title }}</p>
      <p v-if="description" class="mt-1 text-body text-muted-foreground">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
