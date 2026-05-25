<template>
  <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <span class="text-2xl font-bold text-primary-600">NexaPay</span>
        </NuxtLink>

        <nav class="hidden md:flex items-center space-x-1">
          <NuxtLink to="/" class="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors">
            Home
          </NuxtLink>
          <template v-if="isAuthenticated">
            <NuxtLink to="/dashboard" class="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors">
              Dashboard
            </NuxtLink>
            <NuxtLink to="/wallet" class="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors">
              Wallet
            </NuxtLink>
            <NuxtLink to="/transfer" class="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors">
              Transfer
            </NuxtLink>
            <NuxtLink to="/investments" class="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors">
              Investments
            </NuxtLink>
          </template>
        </nav>

        <div class="flex items-center space-x-3">
          <template v-if="isAuthenticated">
            <NuxtLink to="/kyc" class="btn-secondary text-sm hidden sm:inline-flex">
              KYC
            </NuxtLink>
            <button @click="handleLogout" class="btn-danger text-sm">
              Logout
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn-secondary text-sm">
              Login
            </NuxtLink>
            <NuxtLink to="/register" class="btn-primary text-sm">
              Register
            </NuxtLink>
          </template>

          <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="mobileMenuOpen" class="md:hidden pb-3 border-t border-gray-200 pt-2">
        <NuxtLink to="/" class="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600" @click="mobileMenuOpen = false">
          Home
        </NuxtLink>
        <template v-if="isAuthenticated">
          <NuxtLink to="/dashboard" class="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600" @click="mobileMenuOpen = false">
            Dashboard
          </NuxtLink>
          <NuxtLink to="/wallet" class="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600" @click="mobileMenuOpen = false">
            Wallet
          </NuxtLink>
          <NuxtLink to="/transfer" class="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600" @click="mobileMenuOpen = false">
            Transfer
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated, logout } = useAuth()
const mobileMenuOpen = ref(false)

function handleLogout() {
  logout()
}
</script>
