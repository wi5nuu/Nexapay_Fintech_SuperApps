import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const store = useAuthStore()

  if (import.meta.server) {
    return
  }

  const accessToken = localStorage.getItem('nexapay_access_token')
  const refreshToken = localStorage.getItem('nexapay_refresh_token')

  if (!store.isAuthenticated && !accessToken) {
    if (to.path !== '/login' && to.path !== '/register') {
      return navigateTo('/login')
    }
    return
  }

  if (accessToken && !store.tokens) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      store.setTokens({
        accessToken,
        refreshToken: refreshToken ?? '',
        expiresIn: (payload.exp ?? 0) - Math.floor(Date.now() / 1000),
      })
      const fullName: string = payload.name ?? ''
      store.setUser({
        id: payload.sub ?? '',
        email: payload.email ?? '',
        firstName: fullName.split(' ')[0] ?? '',
        lastName: fullName.split(' ').slice(1).join(' ') ?? '',
      })
    } catch {
      localStorage.removeItem('nexapay_access_token')
      localStorage.removeItem('nexapay_refresh_token')
      return navigateTo('/login')
    }
  }

  if (to.path === '/login' || to.path === '/register') {
    if (store.isAuthenticated) {
      return navigateTo('/dashboard')
    }
  }
})
