import type { DocumentsListResponse } from '../types/document'
import type { CreateDocumentInput } from '../types/submitDocument'
import { authHeaders } from './authApi'
import { parseApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/requestCache'

export async function fetchDocuments(): Promise<DocumentsListResponse> {
  const res = await fetch('/api/documents', {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<DocumentsListResponse>
}

export async function fetchPendingApprovalCount(): Promise<{ count: number }> {
  const res = await fetch('/api/documents/pending-count', {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<{ count: number }>
}

// Dashboard, My Documents, Pending Approvals and the app shell's badge counts
// all read the same document list on a typical page load. Cache briefly and
// dedupe concurrent requests so that navigation triggers one network call
// instead of several.
const documentsCache = createCachedRequest(fetchDocuments, 4000)
const pendingCountCache = createCachedRequest(fetchPendingApprovalCount, 4000)

export function fetchDocumentsCached(force = false): Promise<DocumentsListResponse> {
  return documentsCache.get(force)
}

export function invalidateDocumentsCache(): void {
  documentsCache.invalidate()
  pendingCountCache.invalidate()
}

export function fetchPendingApprovalCountCached(force = false): Promise<{ count: number }> {
  return pendingCountCache.get(force)
}

export async function createDocument(input: CreateDocumentInput) {
  const formData = new FormData()
  formData.append('title', input.title.trim())

  if (input.description?.trim()) {
    formData.append('description', input.description.trim())
  }

  formData.append('file', input.file)
  formData.append('approvalChain', JSON.stringify(input.approvalChain))

  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  invalidateDocumentsCache()
  return res.json()
}

