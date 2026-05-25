<template>
  <IonTabs>
    <IonRouterOutlet />

    <IonTabBar slot="bottom">
      <IonTabButton tab="dashboard" href="/dashboard">
        <IonIcon :icon="home" />
        <IonLabel>Home</IonLabel>
      </IonTabButton>

      <IonTabButton tab="wallet" href="/wallet">
        <IonIcon :icon="wallet" />
        <IonLabel>Wallet</IonLabel>
      </IonTabButton>

      <IonTabButton tab="transfer" href="/transfer">
        <IonIcon :icon="send" />
        <IonLabel>Transfer</IonLabel>
      </IonTabButton>

      <IonTabButton tab="profile" href="/profile">
        <IonIcon :icon="person" />
        <IonLabel>Profile</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
</template>

<script setup lang="ts">
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from '@ionic/vue'
import { home, wallet, send, person } from 'ionicons/icons'
</script>
