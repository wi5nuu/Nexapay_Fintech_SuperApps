<template>
  <IonItem>
    <IonIcon :icon="txIcon" :color="txColor" slot="start" size="small" />
    <IonLabel>
      <h2>{{ transaction.description }}</h2>
      <p>{{ formatDate(transaction.createdAt) }}</p>
    </IonLabel>
    <div slot="end" class="ion-text-end">
      <p :class="amountClass" style="font-weight: 600;">
        {{ sign }}{{ formatCurrency(transaction.amount) }}
      </p>
      <IonBadge :color="statusBadgeColor" style="font-size: 10px;">
        {{ transaction.status }}
      </IonBadge>
    </div>
  </IonItem>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonItem, IonLabel, IonIcon, IonBadge } from '@ionic/vue'
import { arrowDown, arrowUp, arrowForward } from 'ionicons/icons'
import type { Transaction } from '@/types'

const props = defineProps<{
  transaction: Transaction
}>()

const isCredit = computed(() =>
  ['credit', 'top_up', 'transfer_in'].includes(props.transaction.type),
)

const sign = computed(() => (isCredit.value ? '+' : '-'))

const txIcon = computed(() => {
  switch (props.transaction.type) {
    case 'credit':
    case 'top_up':
      return arrowUp
    case 'debit':
    case 'withdrawal':
      return arrowDown
    case 'transfer_in':
    case 'transfer_out':
      return arrowForward
    default:
      return arrowForward
  }
})

const txColor = computed(() =>
  isCredit.value ? 'success' : 'danger',
)

const amountClass = computed(() =>
  isCredit.value ? 'text-green-600' : 'text-red-600',
)

const statusBadgeColor = computed(() => {
  switch (props.transaction.status) {
    case 'completed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'danger'
    case 'reversed':
      return 'medium'
    default:
      return 'medium'
  }
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.transaction.currency,
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
</script>
