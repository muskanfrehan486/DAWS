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