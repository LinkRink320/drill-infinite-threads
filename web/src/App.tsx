import React, { useEffect, useMemo, useState } from 'react'
import { fetchJSON } from './lib/api'

type NodeDTO = {
  id: string
  content: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

type NodeWithChildren = NodeDTO & { children?: NodeWithChildren[] }

// fetchJSON moved to lib/api

export default function App() {
  const [posts, setPosts] = useState<NodeDTO[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tree = useMemo(() => {
    const byId: Record<string, NodeWithChildren> = {}
    const roots: NodeWithChildren[] = []
    posts.forEach((p: NodeDTO) => (byId[p.id] = { ...p }))
    Object.values(byId).forEach((n: NodeWithChildren) => {
      if (n.parentId) {
        const parent = byId[n.parentId]
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(n)
        } else {
          roots.push(n) // fallback if parent not present
        }
      } else {
        roots.push(n)
      }
    })
    return roots
  }, [posts])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const roots = await fetchJSON<NodeDTO[]>('/api/posts')
        const map = new Map<string, NodeDTO>()
        roots.forEach(r => map.set(r.id, r))
        for (const r of roots) {
          const descendants = await fetchSubtree(r.id)
          for (const d of descendants) map.set(d.id, d)
        }
        setPosts(Array.from(map.values()))
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  const createComment = async (parentId: string, text: string) => {
    if (!text.trim()) return
    const created = await fetchJSON<NodeDTO>('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, parentId }),
    })
    setPosts((prev: NodeDTO[]) => [...prev, created])
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h1>Infinite Threads</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="新規ポスト"
          value={content}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContent(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          onClick={async () => {
            if (!content.trim()) return
            const created = await fetchJSON<NodeDTO>('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content }),
            })
            setPosts((prev: NodeDTO[]) => [...prev, created])
            setContent('')
          }}
        >
          投稿
        </button>
      </div>

      <ThreadList nodes={tree} onReply={createComment} />
    </div>
  )
}

function ThreadList({ nodes, onReply }: { nodes: NodeWithChildren[]; onReply: (parentId: string, text: string) => void }) {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 16 }}>
      {nodes.map((n: NodeWithChildren) => (
        <li key={n.id} style={{ margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{n.content}</span>
            <InlineReply parentId={n.id} onReply={onReply} />
          </div>
          {n.children && n.children.length > 0 && (
            <div style={{ borderLeft: '2px solid #ddd', marginLeft: 8, paddingLeft: 8 }}>
              <ThreadList nodes={n.children} onReply={onReply} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function InlineReply({ parentId, onReply }: { parentId: string; onReply: (parentId: string, text: string) => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}>返信</button>
      ) : (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
            placeholder="コメントを追加"
          />
          <button
            onClick={() => {
              if (!text.trim()) return
              onReply(parentId, text)
              setText('')
              setOpen(false)
            }}
          >
            送信
          </button>
          <button onClick={() => setOpen(false)}>キャンセル</button>
        </span>
      )}
    </div>
  )
}

type PostWithComments = { post: NodeDTO; comments: NodeDTO[] }
async function fetchSubtree(nodeId: string): Promise<NodeDTO[]> {
  const { comments }: PostWithComments = await fetchJSON(`/api/posts/${nodeId}/comments`)
  const acc: NodeDTO[] = []
  for (const c of comments) {
    acc.push(c)
    const deeper = await fetchSubtree(c.id)
    acc.push(...deeper)
  }
  return acc
}
