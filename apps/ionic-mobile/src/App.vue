<template>
  <ion-app :class="{ 'dark': isDarkMode }">
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isDarkMode = ref(false)

onMounted(() => {
  authStore.initialize()
})
</script>
