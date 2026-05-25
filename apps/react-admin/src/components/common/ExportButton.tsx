import { useState } from 'react'
import api from '@/services/api'

interface ExportButtonProps {
  endpoint: string
  filename?: string
  label?: string
  params?: Record<string, unknown>
  format?: 'csv' | 'pdf'
  disabled?: boolean
}

export default function ExportButton({
  endpoint,
  filename = 'export',
  label = 'Export',
  params = {},
  format = 'csv',
  disabled = false,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await api.get(endpoint, {
        params: { ...params, format },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || loading}
      className="btn-outline btn-sm flex items-center gap-2 disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}
      {loading ? 'Exporting...' : `${label} (${format.toUpperCase()})`}
    </button>
  )
}
