import { ObjectId } from "mongodb";

export interface PostDoc {
  _id: ObjectId;
  content: string;
  parentId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostResponseDTO {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toPostResponse(doc: PostDoc): PostResponseDTO {
  return {
    id: doc._id.toHexString(),
    content: doc.content,
    parentId: doc.parentId ? doc.parentId.toHexString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
