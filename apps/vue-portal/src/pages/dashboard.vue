<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ user?.firstName ?? 'User' }}</h1>
        <p class="text-gray-500 mt-1">Here's your financial overview</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2">
          <WalletCard />
        </div>
        <div class="card">
          <h3 class="text-sm font-medium text-gray-500 mb-2">KYC Status</h3>
          <KycStatusBadge :status="kycStatus" />
          <NuxtLink v-if="kycStatus !== 'verified'" to="/kyc" class="btn-primary text-sm mt-4 inline-block">
            Complete KYC
          </NuxtLink>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <TransactionList :transactions="transactions" :loading="txLoading" :error="txError" />
        </div>
        <div class="space-y-4">
          <NuxtLink to="/transfer" class="btn-primary w-full justify-center">
            Send Money
          </NuxtLink>
          <NuxtLink to="/wallet" class="btn-secondary w-full justify-center">
            View Wallet
          </NuxtLink>
          <NuxtLink to="/investments" class="btn-secondary w-full justify-center">
            Explore Investments
          </NuxtLink>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useWallet } from '~/composables/useWallet'
import { useKyc } from '~/composables/useKyc'
import type { KycLevel } from '~/types'

definePageMeta({
  title: 'Dashboard - NexaPay',
  middleware: ['auth'],
})

const { user } = useAuth()
const { transactions, fetchWallet, fetchTransactions, loading: txLoading, error: txError } = useWallet()
const { fetchKycStatus, status } = useKyc()

const kycStatus = ref<KycLevel>('unverified')

onMounted(async () => {
  await Promise.all([
    fetchWallet(),
    fetchTransactions(),
  ])
  try {
    const res = await fetchKycStatus()
    kycStatus.value = res.status
  } catch {
    kycStatus.value = 'unverified'
  }
})
</script>
