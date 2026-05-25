<template>
  <div class="card p-5 hover:shadow-lg transition-all cursor-pointer group" @click="$emit('select', product)">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
          {{ product.name }}
        </h3>
        <p class="text-xs text-surface-500 mt-0.5 capitalize">{{ product.type.replace('_', ' ') }}</p>
      </div>
      <span
        class="px-2 py-0.5 rounded-full text-xs font-medium"
        :class="riskBadgeClass"
      >
        {{ product.riskLevel }}
      </span>
    </div>
    <p class="text-sm text-surface-600 mb-4 line-clamp-2">{{ product.description }}</p>
    <div class="flex items-center justify-between text-sm">
      <div>
        <p class="text-surface-500">Expected Return</p>
        <p class="font-semibold text-green-600">{{ product.expectedReturn }}%</p>
      </div>
      <div class="text-right">
        <p class="text-surface-500">Min Investment</p>
        <p class="font-semibold text-surface-900">${{ minInvestment }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InvestmentProduct } from '~/types'

const props = defineProps<{
  product: InvestmentProduct
}>()

defineEmits<{
  select: [product: InvestmentProduct]
}>()

const minInvestment = computed(() => {
  return props.product.minInvestment.toLocaleString()
})

const riskBadgeClass = computed(() => {
  switch (props.product.riskLevel) {
    case 'low': return 'bg-green-100 text-green-700'
    case 'medium': return 'bg-amber-100 text-amber-700'
    case 'high': return 'bg-red-100 text-red-700'
    default: return 'bg-surface-100 text-surface-700'
  }
})
</script>
