import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../src/index'
import { connectMongo, closeMongo } from '../src/lib/db'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await connectMongo(uri, 'testdb')
})

afterAll(async () => {
  await closeMongo()
  await mongod.stop()
})

describe('Posts API', () => {
  const app = createApp()

  it('creates a top-level post', async () => {
    const res = await request(app).post('/api/posts').send({ content: '最初のポスト' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ content: '最初のポスト', parentId: null })
    expect(typeof res.body.id).toBe('string')
  })

  it('lists top-level posts', async () => {
    const res = await request(app).get('/api/posts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toMatchObject({ content: '最初のポスト', parentId: null })
  })

  it('creates a comment for a post and fetches with comments', async () => {
    const postRes = await request(app).post('/api/posts').send({ content: '別のポスト' })
    const postId = postRes.body.id

    const c1 = await request(app).post('/api/posts').send({ content: '最初のコメント', parentId: postId })
    expect(c1.status).toBe(201)

    const c2 = await request(app).post('/api/posts').send({ content: '別のコメント', parentId: postId })
    expect(c2.status).toBe(201)

    const getRes = await request(app).get(`/api/posts/${postId}/comments`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.post.id).toBe(postId)
    expect(getRes.body.comments.length).toBe(2)
    expect(getRes.body.comments[0]).toMatchObject({ parentId: postId })
  })

  it('returns 404 when parent not found for comment', async () => {
    const res = await request(app).post('/api/posts').send({ content: 'x', parentId: '64a1b23cabc12345de67890f' })
    expect([400, 404]).toContain(res.status)
  })
})
