import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'owner' | 'cashier' | 'production'
  business_id: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()

  // useCookie is SSR-safe and persists across page reloads
  const token = useCookie<string | null>('berdikari_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    default: () => null,
  })

  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function getHeaders() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await $fetch<{
      success: boolean
      data: { token: string; user: AuthUser }
      message: string
    }>(`${config.public.apiBase}/v1/auth/login`, {
      method: 'POST',
      body: { email, password },
    })

    token.value = response.data.token
    user.value = response.data.user
  }

  async function logout(): Promise<void> {
    if (token.value) {
      try {
        await $fetch(`${config.public.apiBase}/v1/auth/logout`, {
          method: 'POST',
          headers: getHeaders(),
        })
      } catch {}
    }
    token.value = null
    user.value = null
  }

  async function fetchUser(): Promise<void> {
    if (!token.value) return
    try {
      const response = await $fetch<{ success: boolean; data: AuthUser }>(
        `${config.public.apiBase}/v1/auth/me`,
        { headers: getHeaders() },
      )
      user.value = response.data
    } catch {
      token.value = null
      user.value = null
    }
  }

  return { token, user, isAuthenticated, login, logout, fetchUser, getHeaders }
})
