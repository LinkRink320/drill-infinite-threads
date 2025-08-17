import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import postsRouter from "./routes/posts";
import { connectMongo } from "./lib/db";
import cors from "cors";

dotenv.config();

export function createApp() {
  const app = express();
  app.use(express.json());
  if (process.env.CORS_ORIGIN) {
    app.use(cors({ origin: process.env.CORS_ORIGIN }));
  }
  app.use("/api/posts", postsRouter);
  // Serve frontend if built (web/dist)
  const distDir = path.resolve(__dirname, "../web/dist");
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
  return app;
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "drill_infinite_threads";

async function start() {
  await connectMongo(MONGO_URI, DB_NAME);
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
}
