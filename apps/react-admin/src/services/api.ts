import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nexapay_admin_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('nexapay_admin_refresh_token')

      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', { refreshToken })
          const { accessToken } = response.data.data
          localStorage.setItem('nexapay_admin_token', accessToken)
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return api(originalRequest)
        } catch {
          localStorage.removeItem('nexapay_admin_token')
          localStorage.removeItem('nexapay_admin_refresh_token')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('nexapay_admin_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export async function fetchApi<T>(
  endpoint: string,
  options?: { method?: string; data?: unknown; params?: Record<string, unknown> },
): Promise<ApiResponse<T>> {
  const response = await api({
    url: endpoint,
    method: options?.method ?? 'GET',
    data: options?.data,
    params: options?.params,
  })
  return response.data
}

export default api
