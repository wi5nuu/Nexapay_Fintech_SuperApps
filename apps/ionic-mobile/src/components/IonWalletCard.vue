<template>
  <div class="premium-card">
    <p class="text-sm ion-no-margin" style="opacity: 0.9;">Current Balance</p>
    <h2 class="font-bold ion-no-margin" style="font-size: 1.75rem; margin-top: 8px;">
      {{ formatCurrency(balance, currency) }}
    </h2>
    <p v-if="accountNumber" class="text-sm ion-margin-top" style="opacity: 0.8;">
      Account: ****{{ accountNumber.slice(-4) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWalletStore } from '@/stores/wallet'

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
