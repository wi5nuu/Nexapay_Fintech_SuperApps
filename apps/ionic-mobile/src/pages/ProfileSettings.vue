<template>
  <div class="profile-settings">
    <h3>Profile Settings</h3>
    <ion-item>
      <ion-label position="stacked">Name</ion-label>
      <ion-input v-model="name"></ion-input>
    </ion-item>
    <ion-button expand="block" class="ion-margin-top">Save Changes</ion-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonItem, IonLabel, IonInput, IonButton } from '@ionic/vue';
const name = ref('Nexa User');
</script>
