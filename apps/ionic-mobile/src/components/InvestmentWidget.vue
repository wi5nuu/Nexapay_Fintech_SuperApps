<template>
  <div class="investment-widget">
    <h3>My Investments</h3>
    <div v-for="asset in assets" :key="asset.name" class="asset-row">
      <span>{{ asset.name }}</span>
      <span class="value">{{ asset.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const assets = [
  { name: 'NexaIndex Fund', value: '$1,200.00' },
  { name: 'Tech Growth Stock', value: '$850.50' },
];
</script>

<style scoped>
.investment-widget {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}
.asset-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.value {
  font-weight: bold;
}
</style>
