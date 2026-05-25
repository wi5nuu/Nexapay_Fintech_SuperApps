<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Wallet</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="ion-padding-horizontal ion-padding-top">
        <IonWalletCard />
      </div>

      <div class="ion-padding-horizontal ion-padding-top">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Top Up</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div v-if="topUpError" class="ion-padding-bottom">
              <IonText color="danger">{{ topUpError }}</IonText>
            </div>
            <IonItem>
              <IonLabel position="stacked">Amount</IonLabel>
              <IonInput v-model="topUpAmount" type="number" min="1" step="0.01" required />
            </IonItem>
            <IonItem class="ion-margin-bottom">
              <IonLabel position="stacked">Payment Method</IonLabel>
              <IonSelect v-model="paymentMethod">
                <IonSelectOption value="card">Debit/Credit Card</IonSelectOption>
                <IonSelectOption value="bank">Bank Transfer</IonSelectOption>
                <IonSelectOption value="crypto">Cryptocurrency</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonButton expand="block" :disabled="walletLoading" @click="handleTopUp">
              <span v-if="walletLoading">Processing...</span>
              <span v-else>Top Up</span>
            </IonButton>
          </IonCardContent>
        </IonCard>
      </div>

      <div class="ion-padding-bottom">
        <IonList>
          <IonListHeader>
            <IonLabel>Transaction History</IonLabel>
          </IonListHeader>
          <div v-if="txLoading" class="ion-padding ion-text-center" style="color: #9ca3af;">
            <p>Loading...</p>
          </div>
          <div v-else-if="txError" class="ion-padding ion-text-center">
            <IonText color="danger">{{ txError }}</IonText>
          </div>
          <IonTransactionItem v-for="tx in transactions" :key="tx.id" :transaction="tx" />
        </IonList>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonList,
  IonListHeader,
  IonText,
} from '@ionic/vue'
import { useWallet } from '@/composables/useWallet'
import IonWalletCard from '@/components/IonWalletCard.vue'
import IonTransactionItem from '@/components/IonTransactionItem.vue'
import type { TopUpPayload } from '@/types'

const { transactions, fetchWallet, fetchTransactions, topUp, loading: walletLoading, error: topUpError } = useWallet()
const topUpAmount = ref(50)
const paymentMethod = ref('card')
const txLoading = ref(false)
const txError = ref<string | null>(null)

onMounted(async () => {
  txLoading.value = true
  try {
    await Promise.all([fetchWallet(), fetchTransactions()])
  } catch (err: unknown) {
    txError.value = err instanceof Error ? err.message : 'Failed to load'
  } finally {
    txLoading.value = false
  }
})

async function handleTopUp() {
  const payload: TopUpPayload = {
    amount: Number(topUpAmount.value),
    currency: 'USD',
    paymentMethod: paymentMethod.value,
  }
  await topUp(payload)
  topUpAmount.value = 50
}
</script>
