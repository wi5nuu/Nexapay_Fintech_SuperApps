<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-600">NexaPay</h1>
        <p class="text-gray-500 mt-2">Create your account</p>
      </div>

      <div class="card">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div v-if="error" class="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {{ error }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="firstName" class="label">First Name</label>
              <input id="firstName" v-model="firstName" type="text" class="input-field" required />
            </div>
            <div>
              <label for="lastName" class="label">Last Name</label>
              <input id="lastName" v-model="lastName" type="text" class="input-field" required />
            </div>
          </div>

          <div>
            <label for="email" class="label">Email</label>
            <input id="email" v-model="email" type="email" class="input-field" placeholder="you@example.com" required />
          </div>

          <div>
            <label for="phone" class="label">Phone (optional)</label>
            <input id="phone" v-model="phone" type="tel" class="input-field" />
          </div>

          <div>
            <label for="password" class="label">Password</label>
            <input id="password" v-model="password" type="password" class="input-field" placeholder="Minimum 8 characters" required minlength="8" />
          </div>

          <div>
            <label for="confirmPassword" class="label">Confirm Password</label>
            <input id="confirmPassword" v-model="confirmPassword" type="password" class="input-field" required minlength="8" />
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            <span v-if="loading">Creating account...</span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-4">
          Already have an account?
          <NuxtLink to="/login" class="text-primary-600 hover:underline">Sign In</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import type { RegisterPayload } from '~/types'

definePageMeta({
  title: 'Register - NexaPay',
})

const { register, loading, error } = useAuth()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    useAuth().setError('Passwords do not match')
    return
  }
  const payload: RegisterPayload = {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    password: password.value,
    phone: phone.value || undefined,
  }
  await register(payload)
  navigateTo('/dashboard')
}
</script>
