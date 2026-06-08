<template>
  <div class="contact-selection">
    <h3>Select Contact</h3>
    <ion-list>
      <ion-item v-for="contact in contacts" :key="contact.id" button @click="$emit('select', contact)">
        <ion-avatar slot="start">
          <img :src="contact.avatar" />
        </ion-avatar>
        <ion-label>{{ contact.name }}</ion-label>
      </ion-item>
    </ion-list>
  </div>
</template>

<script setup lang="ts">
import { IonList, IonItem, IonLabel, IonAvatar } from '@ionic/vue';

const contacts = [
  { id: 1, name: 'Alice', avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' },
  { id: 2, name: 'Bob', avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg' },
];
defineEmits(['select']);
</script>
