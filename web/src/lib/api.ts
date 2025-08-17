const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api'

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
