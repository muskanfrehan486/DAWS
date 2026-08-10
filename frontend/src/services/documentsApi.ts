import type { DocumentsListResponse } from '../types/document'
import type { CreateDocumentInput } from '../types/submitDocument'
import { authHeaders } from './authApi'

async function parseApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body?.message || body?.error || `Request failed (${res.status})`
}

export async function fetchDocuments(): Promise<DocumentsListResponse> {
  const res = await fetch('/api/documents', {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }

  return res.json() as Promise<DocumentsListResponse>
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

  return res.json()
}
