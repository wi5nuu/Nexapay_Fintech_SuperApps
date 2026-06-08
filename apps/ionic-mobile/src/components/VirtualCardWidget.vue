<template>
  <div class="virtual-card">
    <h3>Virtual Card</h3>
    <div class="card-display">
      <p>**** **** **** 4242</p>
      <p>Limit: $500.00</p>
    </div>
    <ion-button color="danger" fill="outline">Freeze Card</ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
</script>

<style scoped>
.virtual-card {
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 12px;
}
.card-display {
  margin: 16px 0;
  font-family: monospace;
}
</style>
