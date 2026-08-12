/**
 * Reads the backend error shape `{ error: { message } }` (and a few fallbacks)
 * into a plain string suitable for `throw new Error(...)` / UI display.
 * Avoids the classic `[object Object]` when `error` is an object.
 */
export async function parseApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({} as Record<string, unknown>))
  const errorField = body?.error

  if (
    errorField &&
    typeof errorField === 'object' &&
    typeof (errorField as { message?: unknown }).message === 'string'
  ) {
    return (errorField as { message: string }).message
  }

  if (typeof body?.message === 'string') {
    return body.message
  }

  if (typeof errorField === 'string') {
    return errorField
  }

  return `Request failed (${res.status})`
}
