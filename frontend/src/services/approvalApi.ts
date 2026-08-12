import { authHeaders } from './authApi'
import { parseApiError } from '../utils/apiError'
import { invalidateDocumentsCache } from './documentsApi'

export async function rejectDocument(documentId: string, comment?: string) {
  const res = await fetch(`/api/documents/${documentId}/reject`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: comment?.trim() || undefined }),
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  invalidateDocumentsCache()
  return res.json()
}

export async function requestRevision(documentId: string, comment: string) {
  const res = await fetch(`/api/documents/${documentId}/request-revision`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: comment.trim() }),
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  invalidateDocumentsCache()
  return res.json()
}

export interface ApproveDocumentPayload {
  signatureImage: string
  signaturePage: number
  signatureX: number
  signatureY: number
  signatureWidth: number
  signatureHeight: number
}

export async function approveDocument(
  documentId: string,
  payload: ApproveDocumentPayload,
) {
  const res = await fetch(`/api/documents/${documentId}/approve`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  invalidateDocumentsCache()
  return res.json()
}
