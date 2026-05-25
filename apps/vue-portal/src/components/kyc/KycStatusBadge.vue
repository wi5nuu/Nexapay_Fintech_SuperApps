<template>
  <div class="flex items-center space-x-2">
    <span :class="badgeClass" class="px-3 py-1 rounded-full text-sm font-medium">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KycLevel } from '~/types'

const props = defineProps<{
  status: KycLevel
}>()

const badgeClass = computed(() => {
  switch (props.status) {
    case 'verified':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    case 'unverified':
    default:
      return 'bg-gray-100 text-gray-600'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'verified':
      return 'Verified'
    case 'pending':
      return 'Pending Review'
    case 'rejected':
      return 'Rejected'
    case 'unverified':
    default:
      return 'Not Verified'
  }
})
</script>
