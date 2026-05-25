<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Transfer</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div class="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Send Money</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div v-if="error" class="ion-padding-bottom">
              <IonText color="danger">{{ error }}</IonText>
            </div>
            <div v-if="success" class="ion-padding-bottom">
              <IonText color="success">Transfer completed successfully!</IonText>
            </div>

            <IonItem>
              <IonLabel position="stacked">Recipient Email or Phone</IonLabel>
              <IonInput v-model="recipient" type="text" required />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Amount (USD)</IonLabel>
              <IonInput v-model="amount" type="number" min="0.01" step="0.01" required />
            </IonItem>
            <IonItem class="ion-margin-bottom">
              <IonLabel position="stacked">Description (optional)</IonLabel>
              <IonInput v-model="description" type="text" maxlength="100" />
            </IonItem>

            <IonButton expand="block" :disabled="loading" @click="openConfirmModal">
              Review Transfer
            </IonButton>
          </IonCardContent>
        </IonCard>
      </div>

      <IonModal :is-open="showModal" @did-dismiss="showModal = false">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Confirm Transfer</IonTitle>
            <IonButtons slot="end">
              <IonButton @click="showModal = false">Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent class="ion-padding">
          <IonList>
            <IonItem>
              <IonLabel>Recipient</IonLabel>
              <IonText slot="end">{{ recipient }}</IonText>
            </IonItem>
            <IonItem>
              <IonLabel>Amount</IonLabel>
              <IonText slot="end">{{ formatBalance(Number(amount)) }}</IonText>
            </IonItem>
            <IonItem v-if="description">
              <IonLabel>Description</IonLabel>
              <IonText slot="end">{{ description }}</IonText>
            </IonItem>
          </IonList>
          <IonButton expand="block" class="ion-margin-top" :disabled="loading" @click="handleTransfer">
            Confirm Send
          </IonButton>
        </IonContent>
      </IonModal>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  IonButton,
  IonModal,
  IonButtons,
  IonList,
  IonText,
} from '@ionic/vue'
import { useWallet } from '@/composables/useWallet'
import type { TransferPayload } from '@/types'

const { transfer, loading, error } = useWallet()
const recipient = ref('')
const amount = ref<number | null>(null)
const description = ref('')
const showModal = ref(false)
const success = ref(false)

function openConfirmModal() {
  if (!amount.value || amount.value <= 0) return
  showModal.value = true
}

async function handleTransfer() {
  success.value = false
  if (!amount.value || amount.value <= 0) return
  const payload: TransferPayload = {
    recipientId: recipient.value,
    amount: amount.value,
    currency: 'USD',
    description: description.value || undefined,
  }
  await transfer(payload)
  showModal.value = false
  success.value = true
  recipient.value = ''
  amount.value = null
  description.value = ''
}

function formatBalance(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}
</script>
