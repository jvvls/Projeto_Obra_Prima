import { useState } from "react";
import { enviarFeedback } from "../api/obras";
import type { Feedback, Obra, Usuario } from "../api/types";

interface Props {
  obra: Obra;
  usuario: Usuario;
  onClose: () => void;
  onEnviado: (obraAtualizada: Obra) => void;
}

const TIPOS: Feedback["tipo"][] = ["elogio", "reclamacao", "sugestao"];

export default function FeedbackModal({ obra, usuario, onClose, onEnviado }: Props) {
  const [tipo, setTipo] = useState<Feedback["tipo"]>("elogio");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleEnviar() {
    if (!titulo.trim() || !descricao.trim()) {
      setErro("Preencha título e descrição.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const obraAtualizada = await enviarFeedback(obra._id, {
        nome: usuario.dadosPessoais.nomeCompleto,
        cpf: usuario.dadosPessoais.cpf,
        email: usuario.contato.email,
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        anexo: anexo?.name,
      });
      onEnviado(obraAtualizada);
      onClose();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-[92%] max-w-[520px] flex-col gap-3 rounded-xl bg-white p-5 shadow-xl">
        <h3 className="m-0 text-primary">Enviar feedback</h3>

        <input
          readOnly
          value={usuario.dadosPessoais.nomeCompleto}
          className="rounded-lg border border-surface-border bg-surface-muted p-2.5"
        />

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as Feedback["tipo"])}
          className="rounded-lg border border-surface-border p-2.5"
        >
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>

        <input
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="rounded-lg border border-surface-border p-2.5"
        />

        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="min-h-[110px] rounded-lg border border-surface-border p-2.5"
        />

        <input type="file" onChange={(e) => setAnexo(e.target.files?.[0] ?? null)} className="py-1.5" />

        {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

        <div className="flex gap-2.5">
          <button
            onClick={handleEnviar}
            disabled={enviando}
            className="flex-1 rounded-lg bg-primary p-2.5 font-bold text-white disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar feedback"}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg bg-surface-border p-2.5 font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
