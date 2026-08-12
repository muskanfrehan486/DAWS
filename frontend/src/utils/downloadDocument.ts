import { fetchDocumentFile } from '../services/documentDetailApi'

export async function downloadDocumentFile(
  documentId: string,
  fileName?: string,
): Promise<void> {
  const blob = await fetchDocumentFile(documentId)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName ?? `document-${documentId.slice(0, 8)}.pdf`
  link.click()
  window.URL.revokeObjectURL(url)
}
