import { Router } from "express";
import bcrypt from "bcryptjs";
import { Usuario } from "../models/Usuario";
import { verifyAuth } from "../middleware/auth";

const router = Router();

router.post("/", async (req, res) => {
  const { seguranca, ...rest } = req.body ?? {};
  if (!seguranca?.password) return res.status(400).json({ error: "senha é obrigatória" });

  const existente = await Usuario.findOne({ "contato.email": rest?.contato?.email });
  if (existente) return res.status(409).json({ error: "Email já cadastrado" });

  const passwordHash = await bcrypt.hash(seguranca.password, 10);
  const usuario = await Usuario.create({ ...rest, seguranca: { passwordHash } });

  const { seguranca: _s, ...publico } = usuario.toObject();
  res.status(201).json(publico);
});

router.get("/:id", verifyAuth, async (req, res) => {
  if (req.auth!.sub !== req.params.id) return res.status(403).json({ error: "Acesso negado" });
  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });
  const { seguranca, ...publico } = usuario.toObject();
  res.json(publico);
});

router.patch("/:id", verifyAuth, async (req, res) => {
  if (req.auth!.sub !== req.params.id) return res.status(403).json({ error: "Acesso negado" });
  const { seguranca, ...updates } = req.body ?? {};
  const usuario = await Usuario.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });
  const { seguranca: _s, ...publico } = usuario.toObject();
  res.json(publico);
});

export default router;
