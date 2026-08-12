import { api } from "./client";
import type { Usuario } from "./types";

export function cadastrarUsuario(dados: Record<string, unknown>) {
  return api.post<Usuario>("/usuarios", dados);
}

export function getUsuario(id: string) {
  return api.get<Usuario>(`/usuarios/${id}`);
}

export function atualizarUsuario(id: string, dados: Record<string, unknown>) {
  return api.patch<Usuario>(`/usuarios/${id}`, dados);
}
