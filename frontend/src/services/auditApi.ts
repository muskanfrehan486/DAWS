import type { AuditHistoryResponse } from '../types/audit'
import { authHeaders } from './authApi'

async function parseApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body?.message || body?.error || `Request failed (${res.status})`
}

export async function fetchAuditHistory(limit = 100): Promise<AuditHistoryResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  const res = await fetch(`/api/audit/documents?${params.toString()}`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<AuditHistoryResponse>
}

export async function downloadAuditCsv(): Promise<void> {
  const res = await fetch('/api/audit/documents/export', {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'documents-audit.csv'
  link.click()
  window.URL.revokeObjectURL(url)
}

export async function downloadDocumentAuditCsv(documentId: string): Promise<void> {
  const res = await fetch(`/api/documents/${documentId}/audit/export`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `document-audit-${documentId}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}
