<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Profile</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Account Details</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div v-if="loading" class="ion-text-center" style="color: #9ca3af;">
              Loading profile...
            </div>
            <IonList v-else>
              <IonItem>
                <IonLabel>Name</IonLabel>
                <IonText slot="end">{{ user?.firstName }} {{ user?.lastName }}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>Email</IonLabel>
                <IonText slot="end">{{ user?.email }}</IonText>
              </IonItem>
              <IonItem v-if="user?.phone">
                <IonLabel>Phone</IonLabel>
                <IonText slot="end">{{ user?.phone }}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>KYC Status</IonLabel>
                <IonBadge :color="kycBadgeColor" slot="end">{{ kycLabel }}</IonBadge>
              </IonItem>
              <IonItem>
                <IonLabel>Member since</IonLabel>
                <IonText slot="end">{{ formatDate(user?.createdAt ?? '') }}</IonText>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonButton expand="block" color="danger" @click="handleLogout">
          Logout
        </IonButton>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonText,
  IonBadge,
  IonButton,
  IonList,
} from '@ionic/vue'
import { useAuth } from '@/composables/useAuth'
import type { KycLevel } from '@/types'

const { user, loading, fetchProfile, logout } = useAuth()

const kycBadgeColor = computed(() => {
  switch ((user.value?.kycStatus as KycLevel) ?? 'unverified') {
    case 'verified': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    default: return 'medium'
  }
})

const kycLabel = computed(() => {
  switch ((user.value?.kycStatus as KycLevel) ?? 'unverified') {
    case 'verified': return 'Verified'
    case 'pending': return 'Pending Review'
    case 'rejected': return 'Rejected'
    default: return 'Not Verified'
  }
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function handleLogout() {
  logout()
}

onMounted(() => {
  fetchProfile()
})
</script>
