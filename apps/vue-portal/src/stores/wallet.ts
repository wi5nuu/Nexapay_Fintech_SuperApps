import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Wallet, Transaction } from '~/types'

export const useWalletStore = defineStore('wallet', () => {
  const wallet = ref<Wallet | null>(null)
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const balance = computed(() => wallet.value?.balance ?? 0)
  const currency = computed(() => wallet.value?.currency ?? 'USD')
  const recentTransactions = computed(() => transactions.value.slice(0, 10))

  function setWallet(payload: Wallet) {
    wallet.value = payload
  }

  function setTransactions(payload: Transaction[]) {
    transactions.value = payload
  }

  function addTransaction(tx: Transaction) {
    transactions.value.unshift(tx)
  }

  function updateBalance(newBalance: number) {
    if (wallet.value) {
      wallet.value.balance = newBalance
    }
  }

  function setLoading(val: boolean) {
    loading.value = val
  }

  function setError(msg: string | null) {
    error.value = msg
  }

  function clearWallet() {
    wallet.value = null
    transactions.value = []
    loading.value = false
    error.value = null
  }

  return {
    wallet,
    transactions,
    loading,
    error,
    balance,
    currency,
    recentTransactions,
    setWallet,
    setTransactions,
    addTransaction,
    updateBalance,
    setLoading,
    setError,
    clearWallet,
  }
})
