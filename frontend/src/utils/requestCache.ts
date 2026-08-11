/**
 * Small helper to dedupe concurrent calls to the same fetcher and briefly
 * cache the resolved value. Used so that multiple components mounted on the
 * same page navigation (e.g. a page's own data hook plus the app shell's
 * badge counters) collapse into a single network request instead of firing
 * one each.
 */
export function createCachedRequest<T>(fetcher: () => Promise<T>, ttlMs: number) {
  let inFlight: Promise<T> | null = null
  let cached: { value: T; fetchedAt: number } | null = null

  async function get(force = false): Promise<T> {
    if (!force && cached && Date.now() - cached.fetchedAt < ttlMs) {
      return cached.value
    }

    if (!force && inFlight) {
      return inFlight
    }

    inFlight = fetcher()
      .then(value => {
        cached = { value, fetchedAt: Date.now() }
        return value
      })
      .finally(() => {
        inFlight = null
      })

    return inFlight
  }

  function invalidate() {
    cached = null
  }

  return { get, invalidate }
}
