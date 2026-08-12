import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario } from "../models/Usuario";
import { verifyAuth } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const isProd = process.env.NODE_ENV === "production";

function toPublicUsuario(usuario: InstanceType<typeof Usuario>) {
  const { seguranca, ...rest } = usuario.toObject();
  return rest;
}

router.post("/login", async (req, res) => {
  const { email, senha, tipo } = req.body ?? {};
  if (!email || !senha || !tipo) {
    return res.status(400).json({ error: "email, senha e tipo são obrigatórios" });
  }

  const usuario = await Usuario.findOne({ "contato.email": email, gestor: tipo === "gestor" });
  if (!usuario) return res.status(401).json({ error: "Email ou senha incorretos" });

  const senhaValida = await bcrypt.compare(senha, usuario.seguranca.passwordHash);
  if (!senhaValida) return res.status(401).json({ error: "Email ou senha incorretos" });

  const token = jwt.sign({ sub: usuario._id.toString(), gestor: usuario.gestor }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json(toPublicUsuario(usuario));
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.status(204).send();
});

router.get("/me", verifyAuth, async (req, res) => {
  const usuario = await Usuario.findById(req.auth!.sub);
  if (!usuario) return res.status(401).json({ error: "Não autenticado" });
  res.json(toPublicUsuario(usuario));
});

export default router;
