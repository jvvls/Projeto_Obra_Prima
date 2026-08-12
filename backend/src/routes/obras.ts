import { Router } from "express";
import { Obra } from "../models/Obra";
import { verifyAuth, requireGestor } from "../middleware/auth";

const router = Router();

router.get("/", async (_req, res) => {
  const obras = await Obra.find();
  res.json(obras);
});

router.get("/:id", async (req, res) => {
  const obra = await Obra.findById(req.params.id);
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.json(obra);
});

router.post("/", verifyAuth, requireGestor, async (req, res) => {
  const obra = await Obra.create(req.body ?? {});
  res.status(201).json(obra);
});

router.put("/:id", verifyAuth, requireGestor, async (req, res) => {
  const obra = await Obra.findByIdAndUpdate(req.params.id, req.body ?? {}, {
    new: true,
    overwrite: true,
  });
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.json(obra);
});

router.delete("/:id", verifyAuth, requireGestor, async (req, res) => {
  const obra = await Obra.findByIdAndDelete(req.params.id);
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.status(204).send();
});

router.post("/:id/feedbacks", async (req, res) => {
  const { nome, cpf, email, tipo, titulo, descricao, anexo } = req.body ?? {};
  if (!nome || !tipo || !titulo || !descricao) {
    return res.status(400).json({ error: "nome, tipo, titulo e descricao são obrigatórios" });
  }
  const obra = await Obra.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        feedbacks: { nome, cpf, email, tipo, titulo, descricao, anexo, dataEnvio: new Date().toISOString() },
      },
    },
    { new: true }
  );
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.status(201).json(obra);
});

export default router;
