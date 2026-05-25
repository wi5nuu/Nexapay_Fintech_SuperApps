<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Identity Verification</h1>
        <p class="text-gray-500 mt-1">Complete your KYC to unlock all features</p>
      </div>

      <div v-if="currentStatus" class="card mb-6">
        <h3 class="font-semibold text-gray-900 mb-2">Current Status</h3>
        <KycStatusBadge :status="currentStatus.status" />
        <p v-if="currentStatus.rejectionReason" class="text-sm text-red-600 mt-2">
          Reason: {{ currentStatus.rejectionReason }}
        </p>
      </div>

      <div class="card">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="error" class="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{{ error }}</div>
          <div v-if="submitSuccess" class="bg-green-50 text-green-600 text-sm p-3 rounded-lg">KYC submitted successfully!</div>

          <div>
            <label for="docType" class="label">Document Type</label>
            <select id="docType" v-model="documentType" class="input-field" required>
              <option value="">Select...</option>
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>

          <div>
            <label for="docNumber" class="label">Document Number</label>
            <input id="docNumber" v-model="documentNumber" type="text" class="input-field" required />
          </div>

          <div>
            <label for="docFile" class="label">Upload Document</label>
            <input id="docFile" ref="fileInput" type="file" accept="image/*,.pdf" class="input-field" @change="onFileChange" />
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            <span v-if="loading">Submitting...</span>
            <span v-else>Submit for Verification</span>
          </button>
        </form>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useKyc } from '~/composables/useKyc'
import type { KycSubmission, KycStatusResponse } from '~/types'

definePageMeta({
  title: 'KYC Verification - NexaPay',
  middleware: ['auth'],
})

const { loading, error, status, submitKyc, fetchKycStatus } = useKyc()
const documentType = ref('')
const documentNumber = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const submitSuccess = ref(false)
const currentStatus = ref<KycStatusResponse | null>(null)

onMounted(async () => {
  try {
    currentStatus.value = await fetchKycStatus()
  } catch {
    currentStatus.value = null
  }
})

function onFileChange() {
  const files = fileInput.value?.files
  if (files && files.length > 0) {
    selectedFile.value = files[0] as File
  }
}

async function handleSubmit() {
  submitSuccess.value = false
  const payload: KycSubmission = {
    documentType: documentType.value,
    documentNumber: documentNumber.value,
    documentFile: selectedFile.value ?? undefined,
  }
  await submitKyc(payload)
  submitSuccess.value = true
  currentStatus.value = status.value
}
</script>
