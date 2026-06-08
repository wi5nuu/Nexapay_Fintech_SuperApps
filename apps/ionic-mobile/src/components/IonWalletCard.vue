<template>
  <div 
    class="premium-wallet-card" 
    :class="{ 'is-loading': loading }"
    :style="{ '--card-theme': themeColor }"
  >
    <!-- Background SVG Pattern for visual richness -->
    <svg class="card-bg-pattern" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="10" r="40" fill="url(#grad1)" />
      <circle cx="10" cy="90" r="30" fill="url(#grad1)" />
    </svg>

    <div class="card-content">
      <div class="header-row">
        <span class="label">Total Balance</span>
        <ion-icon :icon="cardIcon" class="card-type-icon"></ion-icon>
      </div>

      <div class="balance-display">
        <span v-if="!loading" class="amount">
          {{ showBalance ? formattedBalance : '••••••' }}
        </span>
        <ion-skeleton-text v-else animated style="width: 150px; height: 32px;"></ion-skeleton-text>
        <ion-button fill="clear" size="small" @click.stop="$emit('toggle-visibility')">
          <ion-icon :icon="showBalance ? eyeOffOutline : eyeOutline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>

      <div class="footer-row">
        <div class="account-info">
          <span class="account-label">NexaPay Account</span>
          <span class="account-number">{{ maskedAccountNumber }}</span>
        </div>
        <div class="card-brand">VISA</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon, IonSkeletonText, IonButton } from '@ionic/vue';
import { eyeOutline, eyeOffOutline, walletOutline } from 'ionicons/icons';

interface Props {
  balance: number;
  currency: string;
  accountNumber?: string;
  showBalance?: boolean;
  loading?: boolean;
  themeColor?: string;
  cardIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showBalance: true,
  loading: false,
  themeColor: '#3880ff',
  cardIcon: walletOutline
});

defineEmits(['toggle-visibility']);

const formattedBalance = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency,
  }).format(props.balance);
});

const maskedAccountNumber = computed(() => {
  if (!props.accountNumber) return '**** **** **** ****';
  const last4 = props.accountNumber.slice(-4);
  return `**** **** **** ${last4}`;
});
</script>

<style scoped>
.premium-wallet-card {
  position: relative;
  background: var(--card-theme);
  border-radius: 20px;
  padding: 24px;
  color: white;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.premium-wallet-card:active {
  transform: scale(0.98);
}

.card-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
}

.card-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.85rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-type-icon {
  font-size: 1.5rem;
  opacity: 0.9;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.amount {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.account-info {
  display: flex;
  flex-direction: column;
}

.account-label {
  font-size: 0.75rem;
  opacity: 0.7;
}

.account-number {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 1px;
}

.card-brand {
  font-style: italic;
  font-weight: 900;
  font-size: 1.2rem;
  opacity: 0.9;
}
</style>
