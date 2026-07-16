<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Store, ChevronDown, Check, Loader2 } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useBusinessStore } from '~/stores/business'

const props = withDefaults(defineProps<{
  /** 'header' = plain button (TopNav / mobile bar). 'chip' = pill filter, matches FilterSheet siblings. */
  variant?: 'header' | 'chip'
}>(), {
  variant: 'header',
})

const auth = useAuthStore()
const businessStore = useBusinessStore()
const toast = useToast()

const open = ref(false)
const switching = ref<string | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
// The panel is teleported to <body> — an ancestor of the trigger (e.g. the
// Finance page's horizontally-scrolling filter row, which implicitly clips
// vertical overflow too) must never be able to clip it. Position is
// computed from the trigger's rect instead of relying on CSS `absolute`.
const panelStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

onMounted(async () => {
  await businessStore.fetchBusinesses()
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('scroll', close, true)
  window.addEventListener('resize', close)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('resize', close)
})

function handleOutsideClick(event: MouseEvent) {
  const path = event.composedPath()
  if (triggerRef.value && panelRef.value && !path.includes(triggerRef.value) && !path.includes(panelRef.value)) {
    open.value = false
  }
}

function close() {
  open.value = false
}

async function toggle() {
  if (open.value) {
    open.value = false
    return
  }
  await nextTick()
  const rect = triggerRef.value?.getBoundingClientRect()
  if (rect) {
    panelStyle.value = { top: `${rect.bottom + 6}px`, left: `${rect.left}px` }
  }
  open.value = true
}

// Only worth showing once the user actually has more than one business to
// switch between — keeps the header uncluttered for single-business UMKM.
const showSwitcher = computed(() => businessStore.businesses.length > 1)

const activeBusiness = computed(() =>
  businessStore.businesses.find(b => b.id === auth.user?.business_id) ?? null,
)

async function selectBusiness(id: string) {
  if (id === auth.user?.business_id) {
    open.value = false
    return
  }

  switching.value = id
  try {
    await businessStore.switchBusiness(id)
    open.value = false
  } catch (e: any) {
    toast.error('Gagal beralih bisnis', e?.data?.message ?? 'Coba lagi sebentar, ya.')
  } finally {
    switching.value = null
  }
}
</script>

<template>
  <div v-if="showSwitcher" ref="triggerRef" class="relative">
    <button
      v-if="variant === 'chip'"
      type="button"
      class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border pl-4 pr-3 text-small font-medium transition-colors max-w-[10rem]"
      :class="open ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-transparent text-muted-foreground hover:border-foreground/40'"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span class="truncate">{{ activeBusiness?.name ?? 'Bisnis' }}</span>
      <ChevronDown class="h-3.5 w-3.5 flex-shrink-0 transition-transform" :class="open ? 'rotate-180' : ''" :stroke-width="2" />
    </button>

    <button
      v-else
      type="button"
      class="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-small font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[9rem] sm:max-w-[14rem]"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <Store class="w-4 h-4 text-muted-foreground flex-shrink-0" :stroke-width="1.75" />
      <span class="truncate">{{ activeBusiness?.name ?? 'Pilih Bisnis' }}</span>
      <ChevronDown class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-150" :class="{ 'rotate-180': open }" />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-150"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-1"
      >
        <div
          v-show="open"
          ref="panelRef"
          role="menu"
          aria-label="Pilih bisnis aktif"
          class="fixed w-64 bg-surface rounded-xl border border-border shadow-elevation-3 py-1.5 origin-top-left z-50"
          :style="panelStyle"
        >
          <div class="px-3 py-2 text-caption text-muted-foreground">Bisnis Saya</div>
          <button
            v-for="b in businessStore.businesses"
            :key="b.id"
            type="button"
            role="menuitem"
            class="flex items-center gap-2.5 w-full px-3 py-2 text-body text-foreground hover:bg-muted transition-colors min-h-[44px] disabled:opacity-60"
            :disabled="switching === b.id"
            @click="selectBusiness(b.id)"
          >
            <span class="w-4 h-4 flex-shrink-0 flex items-center justify-center">
              <Loader2 v-if="switching === b.id" class="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <Check v-else-if="b.id === auth.user?.business_id" class="w-4 h-4 text-primary" :stroke-width="2" />
            </span>
            <span class="truncate text-left">{{ b.name }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
