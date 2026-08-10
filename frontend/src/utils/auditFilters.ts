import type { AuditRecord } from '../types/audit'
import { formatDocumentId } from './format'

export function filterAuditRecords(
  records: AuditRecord[],
  search: string,
  actionFilter: string,
): AuditRecord[] {
  const query = search.toLowerCase().trim()

  return records.filter(record => {
    const matchesSearch =
      !query ||
      record.document.toLowerCase().includes(query) ||
      record.documentId.toLowerCase().includes(query) ||
      formatDocumentId(record.documentId).toLowerCase().includes(query) ||
      record.user.toLowerCase().includes(query)

    const matchesAction =
      actionFilter === 'All Actions' || record.action === actionFilter

    return matchesSearch && matchesAction
  })
}
