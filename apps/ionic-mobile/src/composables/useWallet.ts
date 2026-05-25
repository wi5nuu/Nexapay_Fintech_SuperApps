import { useWalletStore } from '@/stores/wallet'
import apiClient from '@/services/api'
import type { Wallet, Transaction, TopUpPayload, TransferPayload } from '@/types'

export function useWallet() {
  const store = useWalletStore()

  async function fetchWallet(): Promise<Wallet> {
    store.setLoading(true)
    store.setError(null)
    try {
      const { data } = await apiClient.get<Wallet>('/wallet')
      store.setWallet(data)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallet'
      store.setError(message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  async function fetchTransactions(): Promise<Transaction[]> {
    store.setLoading(true)
    store.setError(null)
    try {
      const { data } = await apiClient.get<Transaction[]>('/wallet/transactions')
      store.setTransactions(data)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions'
      store.setError(message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  async function topUp(payload: TopUpPayload): Promise<Wallet> {
    store.setLoading(true)
    store.setError(null)
    try {
      const { data } = await apiClient.post<Wallet>('/wallet/topup', payload)
      store.setWallet(data)
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Top-up failed'
      store.setError(message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  async function transfer(payload: TransferPayload): Promise<Transaction> {
    store.setLoading(true)
    store.setError(null)
    try {
      const { data } = await apiClient.post<Transaction>('/wallet/transfer', payload)
      store.addTransaction(data)
      if (store.wallet) {
        store.updateBalance(store.wallet.balance - payload.amount)
      }
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transfer failed'
      store.setError(message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  return {
    ...store,
    fetchWallet,
    fetchTransactions,
    topUp,
    transfer,
  }
}
