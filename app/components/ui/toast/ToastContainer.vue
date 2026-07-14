<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import Toast from './Toast.vue'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col gap-2 p-4 pb-safe sm:inset-x-auto sm:right-0 sm:w-full sm:max-w-sm"
    >
      <TransitionGroup name="toast">
        <Toast
          v-for="t in toasts"
          :key="t.id"
          :variant="t.variant"
          :title="t.title"
          :description="t.description"
          @dismiss="dismiss(t.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease;
}
.toast-enter-from,
.toast-leave-to {
  transform: translateY(12px);
  opacity: 0;
}
.toast-leave-active {
  position: absolute;
}
</style>
