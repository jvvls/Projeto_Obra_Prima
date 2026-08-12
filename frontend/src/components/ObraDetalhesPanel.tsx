import { useState } from "react";
import type { Obra, Usuario } from "../api/types";
import FeedbackModal from "./FeedbackModal";

interface Props {
  obra: Obra;
  usuario: Usuario;
  onClose: () => void;
  onObraAtualizada: (obra: Obra) => void;
}

type Tab = "resumo" | "timeline" | "publicacoes";

const placeholder = "/assets/images/Logo2.png";
const formatCurrency = (value: number) => "R$ " + Number(value || 0).toLocaleString("pt-BR");

function calcularProgresso(marcos: Obra["marcos"]) {
  if (!marcos || marcos.length === 0) return 0;
  const soma = marcos.reduce((total, marco) => total + (Number(marco.percentual) || 0), 0);
  return Math.round(Math.max(0, Math.min(100, soma / marcos.length)));
}

export default function ObraDetalhesPanel({ obra, usuario, onClose, onObraAtualizada }: Props) {
  const [tab, setTab] = useState<Tab>("resumo");
  const [modalAberto, setModalAberto] = useState(false);

  const imagens = obra.anexos?.filter((a) => a.tipo === "imagem") ?? [];
  const progresso = calcularProgresso(obra.marcos);
  const marcosOrdenados = [...(obra.marcos ?? [])].sort((a, b) => (a.percentual || 0) - (b.percentual || 0));

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl">
      <button onClick={onClose} className="mb-2 text-2xl text-neutral-600">
        ×
      </button>
      <div>
        <h2 className="mb-3 text-xl font-bold text-primary">{obra.titulo}</h2>

        <div className="mb-4 flex gap-2 border-b border-surface-border">
          {(
            [
              ["resumo", "Resumo"],
              ["timeline", "Linha do tempo"],
              ["publicacoes", "Feedbacks"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-3 py-2 font-semibold ${
                tab === value ? "border-b-2 border-primary text-primary" : "text-neutral-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "resumo" && (
          <div className="rounded-lg bg-surface-soft p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {imagens.length === 0 ? (
                <img src={placeholder} alt="Sem imagem" className="h-32 w-full rounded-md object-cover" />
              ) : (
                imagens.map((img, i) => (
                  <img
                    key={i}
                    src={img.url || placeholder}
                    alt={img.nomeArquivo}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ))
              )}
            </div>
            <p className="mb-1">
              <strong>Bairro:</strong> {obra.endereco?.bairro || "-"}
            </p>
            <p className="mb-1">
              <strong>Construtora:</strong> {obra.empresaExecutora || "-"}
            </p>
            <p className="mb-1">
              <strong>Status:</strong> {obra.status || "-"}
            </p>
            <p className="mb-1">
              <strong>Valor Total:</strong> {formatCurrency(obra.valorContratado)}
            </p>
            <p className="mt-2 text-neutral-700">{obra.descricao}</p>
          </div>
        )}

        {tab === "timeline" && (
          <div className="rounded-lg bg-surface-soft p-4">
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <strong>Progresso da Obra</strong>
                <span className="font-bold text-primary">{progresso}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full bg-primary" style={{ width: `${progresso}%` }} />
              </div>
              <small className="text-neutral-600">Baseado nos marcos registrados</small>
            </div>

            <hr className="my-4 border-surface-border" />

            <h3 className="mb-2 text-primary">Marcos da Obra</h3>
            {marcosOrdenados.length === 0 && <p className="text-neutral-700">Nenhum marco registrado</p>}
            <ul className="flex flex-col gap-3">
              {marcosOrdenados.map((m, i) => (
                <li key={i} className="rounded-lg border border-surface-border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <strong>{m.titulo}</strong>
                    <span className="text-primary">{m.percentual}%</span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full bg-primary" style={{ width: `${m.percentual}%` }} />
                  </div>
                  <p className="text-sm text-neutral-700">{m.descricao}</p>
                  {m.data && (
                    <small className="text-neutral-600">
                      <strong>Data:</strong> {new Date(m.data).toLocaleDateString("pt-BR")}
                    </small>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "publicacoes" && (
          <div className="rounded-lg bg-surface-soft p-4">
            <button
              onClick={() => setModalAberto(true)}
              className="mb-4 w-full rounded-lg bg-primary p-2.5 font-bold text-white"
            >
              Adicionar feedback
            </button>
            {(!obra.feedbacks || obra.feedbacks.length === 0) && <p>Nenhum feedback registrado</p>}
            <div className="flex flex-col gap-3">
              {obra.feedbacks?.map((f, i) => (
                <div key={i} className="rounded-lg border border-surface-border p-3">
                  <h4 className="mb-1 font-semibold">{f.titulo}</h4>
                  <p className="mb-2 text-sm text-neutral-700">{f.descricao}</p>
                  <div className="flex justify-between text-xs text-neutral-600">
                    <small>
                      <b>{f.nome}</b>
                    </small>
                    <small>{f.dataEnvio ? new Date(f.dataEnvio).toLocaleDateString("pt-BR") : ""}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalAberto && (
        <FeedbackModal
          obra={obra}
          usuario={usuario}
          onClose={() => setModalAberto(false)}
          onEnviado={onObraAtualizada}
        />
      )}
    </div>
  );
}
