<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Dashboard</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="ion-padding">
        <h2>Welcome back, {{ user?.firstName ?? 'User' }}</h2>
      </div>

      <div class="ion-padding-horizontal ion-padding-bottom">
        <IonWalletCard />
      </div>

      <div class="ion-padding-horizontal ion-padding-bottom">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>KYC Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonBadge :color="kycBadgeColor">{{ kycLabel }}</IonBadge>
          </IonCardContent>
        </IonCard>
      </div>

      <div class="ion-padding-bottom">
        <IonList>
          <IonListHeader>
            <IonLabel>Recent Transactions</IonLabel>
          </IonListHeader>
          <div v-if="loading" class="ion-padding ion-text-center" style="color: #9ca3af;">
            <p>Loading transactions...</p>
          </div>
          <div v-else-if="error" class="ion-padding ion-text-center">
            <IonText color="danger">{{ error }}</IonText>
          </div>
          <div v-else-if="transactions.length === 0" class="ion-padding ion-text-center" style="color: #9ca3af;">
            <p>No transactions yet</p>
          </div>
          <IonTransactionItem v-for="tx in transactions" :key="tx.id" :transaction="tx" />
        </IonList>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  IonList,
  IonListHeader,
  IonLabel,
  IonBadge,
  IonText,
} from '@ionic/vue'
import { useAuth } from '@/composables/useAuth'
import { useWallet } from '@/composables/useWallet'
import apiClient from '@/services/api'
import IonWalletCard from '@/components/IonWalletCard.vue'
import IonTransactionItem from '@/components/IonTransactionItem.vue'
import type { KycStatusResponse, KycLevel } from '@/types'

const { user } = useAuth()
const { transactions, fetchWallet, fetchTransactions, loading, error } = useWallet()

const kycStatus = ref<KycLevel>('unverified')

const kycBadgeColor = computed(() => {
  switch (kycStatus.value) {
    case 'verified': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    default: return 'medium'
  }
})

const kycLabel = computed(() => {
  switch (kycStatus.value) {
    case 'verified': return 'Verified'
    case 'pending': return 'Pending Review'
    case 'rejected': return 'Rejected'
    default: return 'Not Verified'
  }
})

onMounted(async () => {
  await Promise.all([fetchWallet(), fetchTransactions()])
  try {
    const { data } = await apiClient.get<KycStatusResponse>('/kyc/status')
    kycStatus.value = data.status
  } catch {
    kycStatus.value = 'unverified'
  }
})
</script>
