import type { ApiApprovalType } from './document'

export interface AssignableUser {
  id: string
  email: string
  firstName: string
  lastName: string
  department: { name: string } | null
}

export interface ApprovalChainStepInput {
  userId: string
  approvalType: ApiApprovalType
}

export interface PreparerSignatureInput {
  useSavedSignature?: boolean
  signatureImage?: string
  signaturePage: number
  signatureX: number
  signatureY: number
  signatureWidth: number
  signatureHeight: number
}

export interface CreateDocumentInput {
  title: string
  description?: string
  file: File
  approvalChain: ApprovalChainStepInput[]
  signature: PreparerSignatureInput
}
