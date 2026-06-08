<template>
  <div class="split-bill">
    <h3>Split Bill</h3>
    <ion-item>
      <ion-label position="stacked">Total Amount</ion-label>
      <ion-input type="number" v-model="amount" placeholder="0.00"></ion-input>
    </ion-item>
    <ion-item>
      <ion-label position="stacked">Number of People</ion-label>
      <ion-input type="number" v-model="people" placeholder="2"></ion-input>
    </ion-item>
    <div class="result">
      <strong>Each person pays: ${{ splitAmount }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonItem, IonLabel, IonInput } from '@ionic/vue';

const amount = ref(0);
const people = ref(2);

const splitAmount = computed(() => {
  return people.value > 0 ? (amount.value / people.value).toFixed(2) : '0.00';
});
</script>
