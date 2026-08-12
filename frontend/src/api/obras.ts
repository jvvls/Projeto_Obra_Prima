import { api } from "./client";
import type { Feedback, Obra } from "./types";

export function listarObras() {
  return api.get<Obra[]>("/obras");
}

export function getObra(id: string) {
  return api.get<Obra>(`/obras/${id}`);
}

export function criarObra(dados: Partial<Obra>) {
  return api.post<Obra>("/obras", dados);
}

export function atualizarObra(id: string, dados: Partial<Obra>) {
  return api.put<Obra>(`/obras/${id}`, dados);
}

export function excluirObra(id: string) {
  return api.delete<void>(`/obras/${id}`);
}

export function enviarFeedback(obraId: string, dados: Omit<Feedback, "dataEnvio">) {
  return api.post<Obra>(`/obras/${obraId}/feedbacks`, dados);
}
