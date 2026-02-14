// backend/src/routes/posts.ts
import { Router } from "express";
import * as fs from "fs";
import * as path from "path";

const router = Router();

// caminho do JSON
const dbPath = path.join(__dirname, "../data/db.json");

// função para ler JSON
const readDB = () => {
  const rawData = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(rawData);
};

// GET /api/posts → retorna todos os posts
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.posts);
});

export default router;
