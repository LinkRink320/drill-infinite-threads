import { Router, Request, Response } from "express";
import { getDb, toObjectId } from "../lib/db";
import { PostDoc, toPostResponse } from "../types/post";

const router = Router();

// Create post or comment
router.post("/", async (req: Request, res: Response) => {
  const { content, parentId } = req.body ?? {};

  if (typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ message: "content is required" });
  }

  let parentObjectId = null;
  if (parentId !== undefined && parentId !== null) {
    const oid = typeof parentId === "string" ? parentId : String(parentId);
    const parsed = toObjectId(oid);
    if (!parsed) return res.status(400).json({ message: "invalid parentId" });
    // verify parent exists
    const { posts } = getDb();
    const parent = await posts.findOne({ _id: parsed });
    if (!parent) return res.status(404).json({ message: "parent not found" });
    parentObjectId = parsed;
  }

  const now = new Date();
  const doc: Omit<PostDoc, "_id"> = {
    content: String(content),
    parentId: parentObjectId,
    createdAt: now,
    updatedAt: now,
  };

  const { posts } = getDb();
  const result = await posts.insertOne(doc as any);
  const inserted = await posts.findOne({ _id: result.insertedId });
  const response = toPostResponse(inserted as PostDoc);
  return res.status(201).json(response);
});

// Get all top-level posts (parentId = null)
router.get("/", async (_req: Request, res: Response) => {
  const { posts } = getDb();
  const docs = await posts
    .find({ parentId: null })
    .sort({ createdAt: 1 })
    .toArray();
  return res.json(docs.map(toPostResponse));
});

// Get a post and its direct comments
router.get("/:postId/comments", async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const oid = toObjectId(postId);
  if (!oid) return res.status(400).json({ message: "invalid postId" });

  const { posts } = getDb();
  // Allow fetching any node (top-level post or nested comment)
  const post = await posts.findOne({ _id: oid });
  if (!post) return res.status(404).json({ message: "post not found" });

  const comments = await posts
    .find({ parentId: oid })
    .sort({ createdAt: 1 })
    .toArray();

  return res.json({
    post: toPostResponse(post),
    comments: comments.map(toPostResponse),
  });
});

export default router;
