const ENV_BASE = (import.meta as any).env?.VITE_API_BASE ?? '/api'
const ENV_BASE_NORM = typeof ENV_BASE === 'string' ? ENV_BASE.replace(/\/+$/, '') : '/api'

function getRuntimeApiBase(): string {
  try {
    const url = new URL(globalThis.location?.href ?? 'http://localhost')
    const fromQuery = url.searchParams.get('api')
    if (fromQuery) return fromQuery.replace(/\/+$/, '')
  } catch {
    // ignore
  }
  try {
    const ls = globalThis.localStorage?.getItem('apiBase')
    if (ls) return ls.replace(/\/+$/, '')
  } catch {
    // ignore
  }
  // @ts-ignore allow optional global override
  const globalBase = (globalThis as any).__API_BASE__
  if (typeof globalBase === 'string' && globalBase) return globalBase.replace(/\/+$/, '')
  return ENV_BASE_NORM
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  // Ensure path starts with a single leading slash
  let p = path.startsWith('/') ? path : `/${path}`
  // Avoid duplicate /api in URL when callers pass "/api/..."
  p = p.replace(/^\/api(\/|$)/, '/$1')
  const base = getRuntimeApiBase()
  return `${base}${p}`
}

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path)
  let res: Response
  try {
    res = await fetch(url, init)
  } catch (e: any) {
    throw new Error(`Network error: ${e?.message ?? 'failed to fetch'} (URL: ${url})`)
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') || ''
    let detail: string | undefined
    try {
      if (ct.includes('application/json')) {
        const j = await res.json()
        detail = typeof j?.message === 'string' ? j.message : JSON.stringify(j)
      } else if (ct.includes('text/plain')) {
        const txt = await res.text()
        detail = txt.slice(0, 200)
      }
    } catch {
      // ignore parse errors
    }
  const baseMsg = `Request failed: ${res.status} ${res.statusText} (URL: ${url})`
    throw new Error(detail ? `${baseMsg} - ${detail}` : baseMsg)
  }
  return res.json()
}
