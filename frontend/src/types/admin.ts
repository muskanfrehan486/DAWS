export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  loginRole: string
  department: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export type UpdateUserPayload = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  departmentId?: string
  loginRole?: string
}

export type BulkUserImportFailure = {
  row: number
  email?: string
  error: string
}

export type BulkUserImportResult = {
  created: number
  failed: BulkUserImportFailure[]
}