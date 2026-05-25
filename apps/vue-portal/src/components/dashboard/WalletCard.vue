<template>
  <div class="card bg-gradient-to-br from-primary-600 to-primary-800 text-white">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-primary-100">Current Balance</h3>
      <span class="text-xs bg-primary-500 px-2 py-1 rounded-full">{{ currency }}</span>
    </div>
    <div class="text-3xl font-bold mb-2">
      {{ formatCurrency(balance, currency) }}
    </div>
    <p class="text-sm text-primary-200" v-if="accountNumber">
      Account: ****{{ accountNumber.slice(-4) }}
    </p>
    <p class="text-sm text-primary-200" v-else>
      No wallet data available
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWalletStore } from '~/stores/wallet'

const store = useWalletStore()

const balance = computed(() => store.balance)
const currency = computed(() => store.currency)
const accountNumber = computed(() => store.wallet?.accountNumber ?? '')

function formatCurrency(amount: number, cur: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cur,
  }).format(amount)
}
</script>
