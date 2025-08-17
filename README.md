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
