import type {
  ApiApprovalActionType,
  ApiAuditEntry,
  AuditActionLabel,
  AuditRecord,
} from '../types/audit'
import { formatDisplayDate } from './format'
import { formatFullName, getInitials } from './user'

const ACTION_LABELS: Record<ApiApprovalActionType, AuditActionLabel> = {
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  REQUEST_REVISION: 'Revision Requested',
  SKIP: 'Step Skipped',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  DOCUMENT_RESUBMITTED: 'Document Resubmitted',
  DOCUMENT_DELETED: 'Document Deleted',
}

const ROLE_LABELS: Record<string, string> = {
  REVIEWER: 'Reviewer',
  APPROVER: 'Approver',
  FINAL_APPROVER: 'Final Approver',
  Preparer: 'Preparer',
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function mapAuditActionLabel(action: string): AuditActionLabel {
  if (action in ACTION_LABELS) {
    return ACTION_LABELS[action as ApiApprovalActionType]
  }

  return 'Approved'
}

export function mapAuditRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

export function mapApiAuditEntryToRecord(entry: ApiAuditEntry): AuditRecord {
  const actionRaw = entry.action as ApiApprovalActionType

  return {
    id: entry.id,
    occurredAt: entry.date,
    date: formatDisplayDate(entry.date),
    time: formatTime(entry.date),
    document: entry.documentTitle,
    documentId: entry.documentId,
    documentStatus: entry.documentStatus,
    user: formatFullName(entry.user.firstName, entry.user.lastName),
    initials: getInitials(entry.user.firstName, entry.user.lastName),
    role: mapAuditRoleLabel(entry.role),
    action: mapAuditActionLabel(entry.action),
    actionRaw,
    comments: entry.comments?.trim() || '—',
  }
}

export function getAuditActionFilterOptions(
  records: AuditRecord[],
): string[] {
  const labels = new Set(records.map(record => record.action))
  return ['All Actions', ...Array.from(labels).sort()]
}
