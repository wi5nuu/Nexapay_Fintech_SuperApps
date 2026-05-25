<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Wallet</h1>
        <p class="text-gray-500 mt-1">Manage your funds</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <WalletCard />

          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Up Wallet</h3>
            <form @submit.prevent="handleTopUp" class="space-y-4">
              <div v-if="topUpError" class="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{{ topUpError }}</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Amount</label>
                  <input v-model="topUpAmount" type="number" min="1" step="0.01" class="input-field" required />
                </div>
                <div>
                  <label class="label">Payment Method</label>
                  <select v-model="paymentMethod" class="input-field" required>
                    <option value="card">Debit/Credit Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>
              <button type="submit" :disabled="walletLoading" class="btn-primary">
                <span v-if="walletLoading">Processing...</span>
                <span v-else>Top Up</span>
              </button>
            </form>
          </div>

          <TransactionList :transactions="transactions" :loading="txLoading" :error="txError" />
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWallet } from '~/composables/useWallet'
import type { TopUpPayload } from '~/types'

definePageMeta({
  title: 'Wallet - NexaPay',
  middleware: ['auth'],
})

const { transactions, fetchWallet, fetchTransactions, topUp, loading: walletLoading, error: topUpError } = useWallet()
const topUpAmount = ref(50)
const paymentMethod = ref('card')
const { loading: txLoading, error: txError } = useWallet()

onMounted(async () => {
  await Promise.all([fetchWallet(), fetchTransactions()])
})

async function handleTopUp() {
  const payload: TopUpPayload = {
    amount: topUpAmount.value,
    currency: 'USD',
    paymentMethod: paymentMethod.value,
  }
  await topUp(payload)
  topUpAmount.value = 50
}
</script>
