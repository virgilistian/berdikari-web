<template>
  <div class="min-h-screen bg-background">
    <!-- Desktop / Tablet Sidebar -->
    <aside
      class="hidden md:flex flex-col fixed inset-y-0 left-0 bg-surface border-r border-border z-30 transition-[width] duration-220 ease-out overflow-hidden"
      :class="sidebarExpanded ? 'w-60' : 'w-16'"
      :aria-label="'Navigasi utama'"
    >
      <!-- Brand -->
      <div class="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span class="text-primary-foreground font-bold text-sm leading-none">B</span>
        </div>
        <span v-show="sidebarExpanded" class="font-semibold text-foreground whitespace-nowrap text-h3 transition-opacity duration-150" :class="sidebarExpanded ? 'opacity-100' : 'opacity-0'">Berdikari ERP</span>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        <NuxtLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px]"
          exact-active-class="bg-accent text-accent-foreground font-medium"
          :aria-label="item.label"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
          <span v-show="sidebarExpanded" class="text-body whitespace-nowrap">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Logout / User info -->
      <div class="p-2 border-t border-border flex-shrink-0">
        <div v-show="sidebarExpanded" class="px-3 py-2 mb-1">
          <p class="text-caption text-muted-foreground truncate">{{ authStore.user?.name ?? '...' }}</p>
          <p class="text-caption text-muted-foreground/70 truncate">{{ authStore.user?.email ?? '' }}</p>
        </div>

        <button
          @click="sidebarExpanded = !sidebarExpanded"
          class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px]"
          :aria-label="sidebarExpanded ? 'Ciutkan sidebar' : 'Perluas sidebar'"
        >
          <ChevronLeft v-if="sidebarExpanded" class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
          <ChevronRight v-else class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
          <span v-show="sidebarExpanded" class="text-body whitespace-nowrap">Ciutkan</span>
        </button>
      </div>
    </aside>

    <!-- Content wrapper -->
    <div
      class="flex flex-col min-h-screen transition-[padding] duration-220 ease-out"
      :class="sidebarExpanded ? 'md:pl-60' : 'md:pl-16'"
    >
      <!-- Desktop top navigation bar -->
      <TopNav
        class="hidden md:flex"
        :sidebar-expanded="sidebarExpanded"
        @toggle-sidebar="sidebarExpanded = !sidebarExpanded"
      />

      <!-- Mobile top bar -->
      <header class="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-surface border-b border-border" style="padding-top: env(safe-area-inset-top, 0px)">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span class="text-primary-foreground font-bold text-xs leading-none">B</span>
          </div>
          <span class="font-semibold text-foreground text-h3">Berdikari</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Notifikasi"
          >
            <Bell class="w-5 h-5" :stroke-width="1.75" />
          </button>
          <button
            @click="handleLogout"
            class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Keluar"
          >
            <LogOut class="w-5 h-5" :stroke-width="1.75" />
          </button>
        </div>
      </header>

      <!-- Page slot -->
      <main class="flex-1">
        <slot />
      </main>

      <!-- Mobile bottom spacer -->
      <div class="md:hidden h-16" aria-hidden="true" />
    </div>

    <!-- Mobile bottom navigation -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      aria-label="Navigasi utama"
    >
      <div class="flex justify-around items-stretch h-16">
        <NuxtLink
          v-for="item in visibleMobileNav"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center gap-0.5 flex-1 text-muted-foreground transition-colors min-h-[44px]"
          exact-active-class="text-primary"
          :aria-label="item.label"
        >
          <component :is="item.icon" class="w-5 h-5" :stroke-width="1.75" />
          <span class="text-caption">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopNav from '~/components/TopNav.vue'
import { Bell, ChevronLeft, ChevronRight, LogOut } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { navItems, mobileNavItems } from '~/config/nav'

const authStore = useAuthStore()
const sidebarExpanded = ref(true)

/**
 * Only show nav items the authenticated user has permission to access.
 * An item with an empty permissions[] is always shown (e.g. Beranda).
 */
const visibleNav = computed(() =>
  navItems.filter(item =>
    item.permissions.length === 0 ||
    item.permissions.some(p => authStore.hasPermission(p))
  )
)

const visibleMobileNav = computed(() =>
  mobileNavItems.filter(item =>
    item.permissions.length === 0 ||
    item.permissions.some(p => authStore.hasPermission(p))
  )
)

async function handleLogout() {
  await authStore.logout()
  window.location.replace('/login')
}
</script>

