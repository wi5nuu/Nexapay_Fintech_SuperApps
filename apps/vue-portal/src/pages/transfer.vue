<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Send Money</h1>
        <p class="text-gray-500 mt-1">Transfer funds to another NexaPay user</p>
      </div>

      <div class="card">
        <form @submit.prevent="handleTransfer" class="space-y-6">
          <div v-if="error" class="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{{ error }}</div>
          <div v-if="success" class="bg-green-50 text-green-600 text-sm p-3 rounded-lg">Transfer completed successfully!</div>

          <div>
            <label for="recipient" class="label">Recipient Email or Phone</label>
            <input id="recipient" v-model="recipient" type="text" class="input-field" placeholder="user@example.com or +1234567890" required />
          </div>

          <div>
            <label for="amount" class="label">Amount (USD)</label>
            <input id="amount" v-model="amount" type="number" min="0.01" step="0.01" class="input-field" :max="maxBalance" required />
            <p class="text-xs text-gray-400 mt-1">Available balance: {{ formatBalance(maxBalance) }}</p>
          </div>

          <div>
            <label for="description" class="label">Description (optional)</label>
            <input id="description" v-model="description" type="text" class="input-field" placeholder="What's this for?" maxlength="100" />
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            <span v-if="loading">Processing...</span>
            <span v-else>Send {{ amount ? formatBalance(Number(amount)) : '' }}</span>
          </button>
        </form>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWallet } from '~/composables/useWallet'
import type { TransferPayload } from '~/types'

definePageMeta({
  title: 'Transfer - NexaPay',
  middleware: ['auth'],
})

const { transfer, fetchWallet, loading, error, balance } = useWallet()
const recipient = ref('')
const amount = ref<number | null>(null)
const description = ref('')
const success = ref(false)

const maxBalance = ref(0)

onMounted(async () => {
  const wallet = await fetchWallet()
  maxBalance.value = wallet.balance
})

async function handleTransfer() {
  success.value = false
  if (!amount.value || amount.value <= 0) return
  const payload: TransferPayload = {
    recipientId: recipient.value,
    amount: amount.value,
    currency: 'USD',
    description: description.value || undefined,
  }
  await transfer(payload)
  success.value = true
  recipient.value = ''
  amount.value = null
  description.value = ''
  maxBalance.value = maxBalance.value - payload.amount
}

function formatBalance(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}
</script>
