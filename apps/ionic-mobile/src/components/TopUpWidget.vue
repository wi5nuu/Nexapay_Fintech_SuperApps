<template>
  <div class="topup-options">
    <h3>Top Up</h3>
    <ion-list>
      <ion-item button>
        <ion-label>Bank Transfer</ion-label>
      </ion-item>
      <ion-item button>
        <ion-label>Credit Card</ion-label>
      </ion-item>
      <ion-item button>
        <ion-label>E-Wallet</ion-label>
      </ion-item>
    </ion-list>
  </div>
</template>

<script setup lang="ts">
import { IonList, IonItem, IonLabel } from '@ionic/vue';
</script>
