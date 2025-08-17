# Drill: Infinite Threads API

TypeScript + Express API with MongoDB storing posts and comments in a single collection.

## Features
- POST /api/posts: Create a post or comment (comment when `parentId` provided)
- GET /api/posts: List all top-level posts
- GET /api/posts/:postId/comments: Get a post and its direct comments

## Quick start
1. Copy `.env.example` to `.env` and adjust values.
2. Install deps.
3. Run dev server.

### Environment
- Node.js >= 18
- MongoDB running locally or in the cloud

## API

### Create a post or comment
POST /api/posts
```json
{
  "content": "text",
  "parentId": "optional parent _id in hex"
}
```
Responses follow shape described in the assignment, with ISO timestamps.

### Get posts
GET /api/posts

### Get a post with comments
GET /api/posts/:postId/comments

## Notes
- Posts are stored in collection `posts` with shape: `{ _id, content, parentId, createdAt, updatedAt }`.
- Indexes on `parentId` and `createdAt`.

## Deploy: GitHub Pages (frontend only)
- The web app can be deployed to GitHub Pages via Actions.
- Vite is configured with `base: /drill-infinite-threads/`.
- API base can be set via `VITE_API_BASE` env when building (e.g., your hosted API URL).

Workflow: `.github/workflows/deploy-pages.yml` will build `web/` and publish `web/dist` to Pages on push to main.

### Production API connection
- Set `VITE_API_BASE` in GitHub → repo → Settings → Secrets and variables → Actions (e.g. `https://your-api.example.com/api`).
- Ensure backend CORS allows origin `https://<your-username>.github.io`.

### Runtime override (for demo/testing)
- You can override the API base at runtime:
  - Query param: `?api=https://your-api.example.com/api`
  - Or set `localStorage.setItem('apiBase', 'https://your-api.example.com/api')` then reload.
