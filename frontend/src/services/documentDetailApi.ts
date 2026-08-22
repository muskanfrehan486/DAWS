import type {
  ApiComment,
  ApiDocumentAuditEntry,
  ApiDocumentDetail,
  ApiWorkflowResponse,
} from '../types/documentDetail.ts'
import { authHeaders } from './authApi'
import { parseApiError } from '../utils/apiError'

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

export async function fetchSupportingDocumentFile(
  documentId: string,
  attachmentId: string,
): Promise<{ blob: Blob; contentType: string }> {
  const res = await fetch(
    `/api/documents/${documentId}/supporting/${attachmentId}/file`,
    {
      headers: { ...authHeaders() },
    },
  )

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  const blob = await res.blob()
  const contentType =
    res.headers.get('Content-Type') || blob.type || 'application/octet-stream'

  return { blob, contentType }
}

export async function downloadSupportingDocument(
  documentId: string,
  attachmentId: string,
  fileName: string,
): Promise<void> {
  const { blob } = await fetchSupportingDocumentFile(documentId, attachmentId)
  const url = window.URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}

export async function resubmitDocument(
  documentId: string,
  file: File,
  signature: {
    useSavedSignature?: boolean
    signatureImage?: string
    signaturePage: number
    signatureX: number
    signatureY: number
    signatureWidth: number
    signatureHeight: number
  },
  supportingFiles: File[] = [],
): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('signature', JSON.stringify(signature))
  for (const supporting of supportingFiles) {
    formData.append('supportingFiles', supporting)
  }

  const res = await fetch(`/api/documents/${documentId}`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
}
