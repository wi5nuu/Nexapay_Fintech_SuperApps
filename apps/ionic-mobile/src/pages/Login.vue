<template>
  <IonPage>
    <IonContent class="ion-padding">
      <div class="login-container">
        <div class="ion-text-center ion-margin-bottom">
          <h1 class="ion-text-primary" style="font-size: 2rem; font-weight: 700;">NexaPay</h1>
          <p style="color: #6b7280;">Sign in to your account</p>
        </div>

        <div v-if="error" class="ion-padding-bottom">
          <IonText color="danger">
            <p>{{ error }}</p>
          </IonText>
        </div>

        <form @submit.prevent="handleLogin">
          <template v-if="!twoFactorPending">
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput v-model="email" type="email" required autocomplete="email" />
            </IonItem>
            <IonItem class="ion-margin-bottom">
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput v-model="password" type="password" required autocomplete="current-password" />
            </IonItem>
          </template>

          <template v-else>
            <IonItem>
              <IonLabel position="stacked">Two-Factor Code</IonLabel>
              <IonInput v-model="twoFactorCode" type="text" maxlength="6" required />
            </IonItem>
          </template>

          <IonButton expand="block" type="submit" :disabled="loading" class="ion-margin-top">
            <span v-if="loading">Loading...</span>
            <span v-else-if="twoFactorPending">Verify Code</span>
            <span v-else>Sign In</span>
          </IonButton>
        </form>

        <p class="ion-text-center ion-margin-top" style="color: #6b7280;">
          Don't have an account?
          <router-link to="/register" style="color: #2563eb;">Register</router-link>
        </p>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, verifyTwoFactor, loading, error, twoFactorPending } = useAuth()

const email = ref('')
const password = ref('')
const twoFactorCode = ref('')

async function handleLogin() {
  if (!twoFactorPending.value) {
    const res = await login({ email: email.value, password: password.value })
    if (res.twoFactorRequired) return
    router.replace('/dashboard')
  } else {
    await verifyTwoFactor(twoFactorCode.value)
    router.replace('/dashboard')
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding-top: 48px;
}
</style>
