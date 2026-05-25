<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-600">NexaPay</h1>
        <p class="text-gray-500 mt-2">Sign in to your account</p>
      </div>

      <div class="card">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div v-if="error" class="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {{ error }}
          </div>

          <template v-if="!twoFactorPending">
            <div>
              <label for="email" class="label">Email</label>
              <input id="email" v-model="email" type="email" class="input-field" placeholder="you@example.com" required autocomplete="email" />
            </div>
            <div>
              <label for="password" class="label">Password</label>
              <input id="password" v-model="password" type="password" class="input-field" placeholder="••••••••" required autocomplete="current-password" />
            </div>
          </template>

          <template v-else>
            <div>
              <label for="code" class="label">Two-Factor Code</label>
              <input id="code" v-model="twoFactorCode" type="text" class="input-field" placeholder="000000" maxlength="6" required />
            </div>
          </template>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            <span v-if="loading">Loading...</span>
            <span v-else-if="twoFactorPending">Verify Code</span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-4">
          Don't have an account?
          <NuxtLink to="/register" class="text-primary-600 hover:underline">Register</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  title: 'Sign In - NexaPay',
})

const { login, verifyTwoFactor, loading, error, twoFactorPending } = useAuth()

const email = ref('')
const password = ref('')
const twoFactorCode = ref('')

async function handleLogin() {
  if (!twoFactorPending.value) {
    const res = await login({ email: email.value, password: password.value })
    if (res.twoFactorRequired) return
    navigateTo('/dashboard')
  } else {
    await verifyTwoFactor(twoFactorCode.value)
    navigateTo('/dashboard')
  }
}
</script>
