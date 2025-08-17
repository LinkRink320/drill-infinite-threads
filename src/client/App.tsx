import React, { useEffect, useMemo, useState } from 'react';

type NodeDTO = {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

type NodeWithChildren = NodeDTO & { children?: NodeWithChildren[] };

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function App() {
  const [posts, setPosts] = useState<NodeDTO[]>([]);
  const [content, setContent] = useState('');

  const tree = useMemo(() => {
    const byId: Record<string, NodeWithChildren> = {};
    const roots: NodeWithChildren[] = [];
    posts.forEach(p => (byId[p.id] = { ...p }));
    Object.values(byId).forEach(n => {
      if (n.parentId) {
        const parent = byId[n.parentId];
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(n);
        } else {
          roots.push(n); // fallback if parent not present
        }
      } else {
        roots.push(n);
      }
    });
    return roots;
  }, [posts]);

  useEffect(() => {
    fetchJSON<NodeDTO[]>('/api/posts').then(setPosts).catch(console.error);
  }, []);

  const createPost = async (parentId?: string) => {
    const text = prompt('内容を入力してください', '');
    if (!text) return;
    const body: any = { content: text };
    if (parentId) body.parentId = parentId;
    const created = await fetchJSON<NodeDTO>('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setPosts(prev => [...prev, created]);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h1>Infinite Threads</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="新規ポスト"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          onClick={async () => {
            if (!content.trim()) return;
            const created = await fetchJSON<NodeDTO>('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content }),
            });
            setPosts(prev => [...prev, created]);
            setContent('');
          }}
        >
          投稿
        </button>
      </div>

      <ThreadList nodes={tree} onReply={createPost} />
    </div>
  );
}

function ThreadList({ nodes, onReply }: { nodes: NodeWithChildren[]; onReply: (parentId: string) => void }) {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: 16 }}>
      {nodes.map(n => (
        <li key={n.id} style={{ margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{n.content}</span>
            <button onClick={() => onReply(n.id)}>返信</button>
          </div>
          {n.children && n.children.length > 0 && (
            <div style={{ borderLeft: '2px solid #ddd', marginLeft: 8, paddingLeft: 8 }}>
              <ThreadList nodes={n.children} onReply={onReply} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
