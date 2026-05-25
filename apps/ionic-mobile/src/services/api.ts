import axios from 'axios'
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Simulated local state
let mockBalance = 1500.00
const mockTransactions = [
  { id: '1', amount: 50, type: 'credit', description: 'Top Up', date: new Date().toISOString() }
]

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  console.log(`Mocking request to: ${config.url}`, config.data)
  
  let responseData: any = {}
  
  if (config.url === '/auth/login') {
    responseData = { user: { id: '1', name: 'User' }, tokens: { accessToken: 'token' } }
  } else if (config.url === '/wallet') {
    responseData = { balance: mockBalance, currency: 'USD', accountNumber: '1234567890' }
  } else if (config.url === '/wallet/transactions') {
    responseData = mockTransactions
  } else if (config.url === '/wallet/topup') {
    mockBalance += config.data.amount
    responseData = { balance: mockBalance, currency: 'USD', accountNumber: '1234567890' }
  } else if (config.url === '/wallet/transfer') {
    mockBalance -= config.data.amount
    responseData = { id: Math.random().toString(), amount: config.data.amount, type: 'debit', description: 'Transfer' }
  }

  // Reject with the mock response to simulate successful network call
  return Promise.reject({
    config,
    response: { status: 200, data: responseData },
  })
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    if (error.response?.status === 200) return Promise.resolve(error.response)
    return Promise.reject(error)
  }
)

export default apiClient
