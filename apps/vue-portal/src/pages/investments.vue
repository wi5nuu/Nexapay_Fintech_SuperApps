<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Investment Opportunities</h1>
        <p class="text-gray-500 mt-1">Grow your wealth with curated options</p>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400">
        Loading investment products...
      </div>

      <div v-else-if="error" class="text-center py-12 text-red-500">
        {{ error }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="product in products" :key="product.id" class="card hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <span :class="riskBadge(product.riskLevel)" class="px-2 py-1 rounded-full text-xs font-medium">
              {{ product.riskLevel }} risk
            </span>
            <span v-if="!product.available" class="text-xs text-gray-400">Coming soon</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ product.name }}</h3>
          <p class="text-sm text-gray-500 mb-4">{{ product.description }}</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Expected return</span>
              <span class="font-semibold text-accent-600">{{ product.expectedReturn }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Duration</span>
              <span>{{ product.durationDays }} days</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Min investment</span>
              <span>{{ formatCurrency(product.minInvestment) }}</span>
            </div>
          </div>
          <button :disabled="!product.available" class="btn-primary w-full mt-4" @click="invest(product.id)">
            Invest Now
          </button>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '~/services/api'
import type { InvestmentProduct } from '~/types'

definePageMeta({
  title: 'Investments - NexaPay',
  middleware: ['auth'],
})

const products = ref<InvestmentProduct[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const { data } = await apiClient.get<InvestmentProduct[]>('/investments')
    products.value = data
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load investments'
  } finally {
    loading.value = false
  }
})

function riskBadge(risk: string): string {
  switch (risk) {
    case 'low':
      return 'bg-green-100 text-green-700'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'high':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function invest(productId: string) {
  navigateTo(`/wallet?invest=${productId}`)
}
</script>
