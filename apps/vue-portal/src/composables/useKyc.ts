import { ref } from 'vue'
import apiClient from '~/services/api'
import type { KycSubmission, KycStatusResponse } from '~/types'

export function useKyc() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const status = ref<KycStatusResponse | null>(null)

  async function submitKyc(payload: KycSubmission): Promise<KycStatusResponse> {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('documentType', payload.documentType)
      formData.append('documentNumber', payload.documentNumber)
      if (payload.documentFile) {
        formData.append('documentFile', payload.documentFile)
      }
      const { data } = await apiClient.post<KycStatusResponse>('/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      status.value = data
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'KYC submission failed'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchKycStatus(): Promise<KycStatusResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get<KycStatusResponse>('/kyc/status')
      status.value = data
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch KYC status'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    status,
    submitKyc,
    fetchKycStatus,
  }
}
