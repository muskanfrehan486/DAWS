import type { ApiApprovalType } from '../types/document'
import type { ApprovalChainStepInput } from '../types/submitDocument'

export interface ApprovalStepForm {
  id: string
  approvalType: ApiApprovalType
  userId: string
}

export const APPROVAL_TYPE_OPTIONS: {
  value: ApiApprovalType
  label: string
}[] = [
  { value: 'REVIEWER', label: 'Reviewer' },
  { value: 'APPROVER', label: 'Approver' },
  { value: 'FINAL_APPROVER', label: 'Final Approver' },
]

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024
export const MAX_SUPPORTING_FILES = 5

export const SUPPORTING_FILE_ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv'

const SUPPORTING_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
])

export function validateSupportingFile(file: File): string | null {
  const extensionOk = /\.(pdf|png|jpe?g|docx?|xlsx?|txt|csv)$/i.test(file.name)
  if (!SUPPORTING_MIME_TYPES.has(file.type) && !extensionOk) {
    return `"${file.name}" is not an allowed supporting file type.`
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return `"${file.name}" exceeds the 20 MB limit.`
  }
  return null
}

export function validateSubmitDocumentForm(input: {
  title: string
  file: File | null
  steps: ApprovalStepForm[]
}): string | null {
  if (!input.title.trim()) {
    return 'Document title is required.'
  }

  if (!input.file) {
    return 'A PDF document is required.'
  }

  if (input.file.type !== 'application/pdf') {
    return 'Only PDF files are allowed.'
  }

  if (input.file.size > MAX_PDF_SIZE_BYTES) {
    return 'File size must not exceed 20 MB.'
  }

  if (input.steps.length === 0) {
    return 'At least one approval step is required.'
  }

  if (input.steps.some(step => !step.userId)) {
    return 'Each approval step must have an assigned user.'
  }

  const userIds = input.steps.map(step => step.userId)
  if (new Set(userIds).size !== userIds.length) {
    return 'Duplicate users are not allowed in the approval chain.'
  }

  const finalApprovers = input.steps.filter(
    step => step.approvalType === 'FINAL_APPROVER',
  )

  if (finalApprovers.length !== 1) {
    return 'Exactly one Final Approver is required.'
  }

  const lastStep = input.steps[input.steps.length - 1]
  if (lastStep.approvalType !== 'FINAL_APPROVER') {
    return 'Final Approver must be the last step.'
  }

  return null
}

export function toApprovalChainPayload(
  steps: ApprovalStepForm[],
): ApprovalChainStepInput[] {
  return steps.map(step => ({
    userId: step.userId,
    approvalType: step.approvalType,
  }))
}
