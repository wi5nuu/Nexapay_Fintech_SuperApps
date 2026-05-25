import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthTokens, LoginCredentials, RegisterPayload } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const twoFactorPending = ref(false)

  const isAuthenticated = computed(() => !!tokens.value?.accessToken)
  const isTwoFactorPending = computed(() => twoFactorPending.value)

  function setUser(payload: User) {
    user.value = payload
  }

  function setTokens(payload: AuthTokens) {
    tokens.value = payload
    if (import.meta.client) {
      localStorage.setItem('nexapay_access_token', payload.accessToken)
      localStorage.setItem('nexapay_refresh_token', payload.refreshToken)
    }
  }

  function setTwoFactorPending(value: boolean) {
    twoFactorPending.value = value
  }

  function setError(msg: string | null) {
    error.value = msg
  }

  function setLoading(val: boolean) {
    loading.value = val
  }

  function clearAuth() {
    user.value = null
    tokens.value = null
    twoFactorPending.value = false
    error.value = null
    if (import.meta.client) {
      localStorage.removeItem('nexapay_access_token')
      localStorage.removeItem('nexapay_refresh_token')
    }
  }

  return {
    user,
    tokens,
    loading,
    error,
    twoFactorPending,
    isAuthenticated,
    isTwoFactorPending,
    setUser,
    setTokens,
    setTwoFactorPending,
    setError,
    setLoading,
    clearAuth,
  }
})
