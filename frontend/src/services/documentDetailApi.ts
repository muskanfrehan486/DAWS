import type {
  ApiComment,
  ApiDocumentAuditEntry,
  ApiDocumentDetail,
  ApiWorkflowResponse,
} from '../types/documentDetail.ts'
import { authHeaders } from './authApi'

async function parseApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body?.message || body?.error || `Request failed (${res.status})`
}

export async function fetchDocumentById(
  documentId: string,
): Promise<ApiDocumentDetail> {
  const res = await fetch(`/api/documents/${documentId}`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<ApiDocumentDetail>
}

export async function fetchDocumentWorkflow(
  documentId: string,
): Promise<ApiWorkflowResponse> {
  const res = await fetch(`/api/documents/${documentId}/workflow`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<ApiWorkflowResponse>
}

export async function fetchDocumentComments(
  documentId: string,
): Promise<ApiComment[]> {
  const res = await fetch(`/api/documents/${documentId}/comments`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const data = await res.json()
  return data.comments as ApiComment[]
}

export async function createDocumentComment(
  documentId: string,
  comment: string,
): Promise<ApiComment> {
  const res = await fetch(`/api/documents/${documentId}/comments`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const data = await res.json()
  return data.comment as ApiComment
}

export async function fetchDocumentAuditHistory(
  documentId: string,
): Promise<ApiDocumentAuditEntry[]> {
  const res = await fetch(`/api/documents/${documentId}/audit`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const data = await res.json()
  return data.auditHistory as ApiDocumentAuditEntry[]
}

export async function fetchDocumentFile(documentId: string): Promise<Blob> {
  const res = await fetch(`/api/documents/${documentId}/file`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.blob()
}
