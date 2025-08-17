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
  const base = getRuntimeApiBase()

  // Demo mode: simulate API when base is 'demo' or 'local'
  if (/^(demo|local)\b/i.test(base)) {
    return demoHandle<T>(path, init)
  }
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

// ----- Demo mode implementation -----
type DemoNode = { id: string; content: string; parentId: string | null; createdAt: string; updatedAt: string }

function nowISO() { return new Date().toISOString() }
function uuid() {
  try { return (globalThis.crypto as any)?.randomUUID?.() ?? Math.random().toString(16).slice(2) }
  catch { return Math.random().toString(16).slice(2) }
}

function readStore(): DemoNode[] {
  try {
    const raw = localStorage.getItem('demoPosts')
    if (raw) return JSON.parse(raw)
  } catch {}
  // seed
  const seed: DemoNode[] = [{ id: uuid(), content: 'ようこそ！これはデモモードです。', parentId: null, createdAt: nowISO(), updatedAt: nowISO() }]
  writeStore(seed)
  return seed
}
function writeStore(list: DemoNode[]) {
  try { localStorage.setItem('demoPosts', JSON.stringify(list)) } catch {}
}

async function demoHandle<T>(path: string, init?: RequestInit): Promise<T> {
  // Normalize path (strip any leading "/api")
  let p = path.startsWith('/') ? path : `/${path}`
  p = p.replace(/^\/api(\/|$)/, '/$1')
  const method = (init?.method || 'GET').toUpperCase()
  const store = readStore()

  if (p === '/posts' && method === 'GET') {
    const tops = store.filter(n => n.parentId === null)
    return tops as any as T
  }

  if (p === '/posts' && method === 'POST') {
    let body: any = {}
    try { body = init?.body ? JSON.parse(String(init.body)) : {} } catch {}
    const content = String(body?.content ?? '').trim()
    const parentId = body?.parentId ?? null
    if (!content) throw new Error('Validation error: content is required (demo)')
    if (parentId && !store.find(s => s.id === parentId)) throw new Error('Parent not found (demo)')
    const node: DemoNode = { id: uuid(), content, parentId, createdAt: nowISO(), updatedAt: nowISO() }
    const next = [...store, node]
    writeStore(next)
    return node as any as T
  }

  const m = p.match(/^\/posts\/([^/]+)\/comments$/)
  if (m && method === 'GET') {
    const id = m[1]
    const post = store.find(s => s.id === id)
    if (!post) throw new Error('Not found (demo)')
    const comments = store.filter(s => s.parentId === id)
    return { post, comments } as any as T
  }

  throw new Error(`Demo: endpoint not implemented for ${method} ${p}`)
}
