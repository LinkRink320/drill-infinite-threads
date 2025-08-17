const RAW_BASE = (import.meta as any).env?.VITE_API_BASE ?? '/api'
const API_BASE = typeof RAW_BASE === 'string' ? RAW_BASE.replace(/\/+$/, '') : '/api'

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  // Ensure path starts with a single leading slash
  let p = path.startsWith('/') ? path : `/${path}`
  // Avoid duplicate /api in URL when callers pass "/api/..."
  p = p.replace(/^\/api(\/|$)/, '/$1')
  return `${API_BASE}${p}`
}

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path)
  let res: Response
  try {
    res = await fetch(url, init)
  } catch (e: any) {
    throw new Error(`Network error: ${e?.message ?? 'failed to fetch'}`)
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
    const baseMsg = `Request failed: ${res.status} ${res.statusText}`
    throw new Error(detail ? `${baseMsg} - ${detail}` : baseMsg)
  }
  return res.json()
}
