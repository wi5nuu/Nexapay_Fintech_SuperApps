<template>
  <div class="card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
    <div v-if="loading" class="text-center py-8 text-gray-400">
      Loading transactions...
    </div>
    <div v-else-if="error" class="text-center py-8 text-red-500">
      {{ error }}
    </div>
    <div v-else-if="transactions.length === 0" class="text-center py-8 text-gray-400">
      No transactions yet
    </div>
    <ul v-else class="divide-y divide-gray-100">
      <li v-for="tx in transactions" :key="tx.id" class="py-3 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div :class="txClass(tx.type)" class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold">
            {{ txIcon(tx.type) }}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">{{ tx.description }}</p>
            <p class="text-xs text-gray-500">{{ formatDate(tx.createdAt) }}</p>
          </div>
        </div>
        <div class="text-right">
          <p :class="amountClass(tx.type)" class="text-sm font-semibold">
            {{ tx.type === 'credit' || tx.type === 'transfer_in' || tx.type === 'top_up' ? '+' : '-' }}{{ formatCurrency(tx.amount, tx.currency) }}
          </p>
          <span :class="statusClass(tx.status)" class="text-xs px-2 py-0.5 rounded-full">
            {{ tx.status }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Transaction, TransactionType, TransactionStatus } from '~/types'

defineProps<{
  transactions: Transaction[]
  loading: boolean
  error: string | null
}>()

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function txClass(type: TransactionType): string {
  switch (type) {
    case 'credit':
    case 'top_up':
    case 'transfer_in':
      return 'bg-green-100 text-green-600'
    case 'debit':
    case 'transfer_out':
    case 'withdrawal':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function txIcon(type: TransactionType): string {
  switch (type) {
    case 'credit':
    case 'top_up':
      return '↑'
    case 'debit':
    case 'withdrawal':
      return '↓'
    case 'transfer_in':
      return '→'
    case 'transfer_out':
      return '←'
    default:
      return '•'
  }
}

function amountClass(type: TransactionType): string {
  return type === 'credit' || type === 'top_up' || type === 'transfer_in'
    ? 'text-green-600'
    : 'text-red-600'
}

function statusClass(status: TransactionStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'failed':
      return 'bg-red-100 text-red-700'
    case 'reversed':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
</script>
