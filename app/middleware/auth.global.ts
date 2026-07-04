import { useAuthStore } from '~/stores/auth'

/**
 * Global route guard: redirects unauthenticated users to /login.
 * The /login page itself is excluded to avoid redirect loops.
 * Token is stored in a cookie (SSR-safe via useCookie in auth store).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Allow public routes
  if (to.path === '/login') return

  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Hydrate user object on client after page refresh
  if (import.meta.client && !authStore.user) {
    await authStore.fetchUser()
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }
  }
})
