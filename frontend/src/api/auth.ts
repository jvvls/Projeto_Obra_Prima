import { api } from "./client";
import type { Usuario } from "./types";

export function login(email: string, senha: string, tipo: "cidadao" | "gestor") {
  return api.post<Usuario>("/auth/login", { email, senha, tipo });
}

export function logout() {
  return api.post<void>("/auth/logout");
}

export function getMe() {
  return api.get<Usuario>("/auth/me");
}
