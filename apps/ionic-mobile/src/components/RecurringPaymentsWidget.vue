<template>
  <div class="recurring-payments">
    <h3>Recurring Payments</h3>
    <ion-list>
      <ion-item v-for="payment in payments" :key="payment.id">
        <ion-label>
          <h2>{{ payment.name }}</h2>
          <p>{{ payment.amount }} - {{ payment.frequency }}</p>
        </ion-label>
        <ion-toggle slot="end" :checked="payment.active"></ion-toggle>
      </ion-item>
    </ion-list>
  </div>
</template>

<script setup lang="ts">
import { IonList, IonItem, IonLabel, IonToggle } from '@ionic/vue';

const payments = [
  { id: 1, name: 'Netflix', amount: '$15.99', frequency: 'Monthly', active: true },
  { id: 2, name: 'Internet', amount: '$50.00', frequency: 'Monthly', active: true },
];
</script>
