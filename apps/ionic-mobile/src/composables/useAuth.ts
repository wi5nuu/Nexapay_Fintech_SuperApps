import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/services/api'
import type { LoginCredentials, RegisterPayload, AuthResponse, User } from '@/types'

export function useAuth() {
  const router = useRouter()
  const store = useAuthStore()

  async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    store.setLoading(true)
    store.setError(null)
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials)
      if (data.twoFactorRequired) {
        store.setTwoFactorPending(true)
        return data
      }
      store.setTokens(data.tokens)
      store.setUser(data.user)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      store.setError(message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  async function register(payload: RegisterPayload): Promise<AuthResponse> {
    store.setLoading(true)
    store.setError(null)
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
      store.setTokens(data.tokens)
      store.setUser(data.user)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      store.setError(message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  async function verifyTwoFactor(code: string): Promise<AuthResponse> {
    store.setLoading(true)
    store.setError(null)
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/2fa/verify', { code })
      store.setTokens(data.tokens)
      store.setUser(data.user)
      store.setTwoFactorPending(false)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '2FA verification failed'
      store.setError(message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  async function fetchProfile(): Promise<User> {
    try {
      const { data } = await apiClient.get<User>('/auth/profile')
      store.setUser(data)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile'
      store.setError(message)
      throw err
    }
  }

  function logout() {
    store.clearAuth()
    router.replace('/login')
  }

  return {
    ...store,
    login,
    register,
    verifyTwoFactor,
    fetchProfile,
    logout,
  }
}
