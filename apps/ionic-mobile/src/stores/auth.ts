import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthTokens, LoginCredentials, RegisterPayload } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const twoFactorPending = ref(false)

  const isAuthenticated = computed(() => !!tokens.value?.accessToken)

  function setUser(payload: User) {
    user.value = payload
  }

  function setTokens(payload: AuthTokens) {
    tokens.value = payload
    localStorage.setItem('nexapay_access_token', payload.accessToken)
    localStorage.setItem('nexapay_refresh_token', payload.refreshToken)
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

  function initialize() {
    const accessToken = localStorage.getItem('nexapay_access_token')
    const refreshToken = localStorage.getItem('nexapay_refresh_token')
    if (accessToken) {
      tokens.value = {
        accessToken,
        refreshToken: refreshToken ?? '',
        expiresIn: 0,
      }
    }
  }

  function clearAuth() {
    user.value = null
    tokens.value = null
    twoFactorPending.value = false
    error.value = null
    localStorage.removeItem('nexapay_access_token')
    localStorage.removeItem('nexapay_refresh_token')
  }

  return {
    user,
    tokens,
    loading,
    error,
    twoFactorPending,
    isAuthenticated,
    setUser,
    setTokens,
    setTwoFactorPending,
    setError,
    setLoading,
    initialize,
    clearAuth,
  }
})
