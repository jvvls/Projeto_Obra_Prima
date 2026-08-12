import type { Obra } from "../../api/types";

interface Props {
  obras: Obra[];
  statusDisponiveis: string[];
  cidadesDisponiveis: string[];
  selecionadaId: string | null;
  busca: string;
  onBuscaChange: (valor: string) => void;
  filtroStatus: string;
  onFiltroStatusChange: (valor: string) => void;
  filtroCidade: string;
  onFiltroCidadeChange: (valor: string) => void;
  ordenarPor: "titulo" | "dataInicio";
  onOrdenarPorChange: (valor: "titulo" | "dataInicio") => void;
  onSelecionar: (id: string) => void;
  onNovaObra: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  "Concluída": "bg-emerald-100 text-emerald-700",
  "Em andamento": "bg-amber-100 text-amber-700",
  "Paralisada": "bg-red-100 text-red-700",
  "Planejada": "bg-neutral-200 text-neutral-700",
};

function badgeClasses(status: string) {
  return STATUS_BADGE[status] ?? "bg-neutral-200 text-neutral-700";
}

function calcularProgresso(marcos: Obra["marcos"]) {
  if (!marcos || marcos.length === 0) return 0;
  const soma = marcos.reduce((acc, m) => acc + (Number(m.percentual) || 0), 0);
  return Math.max(0, Math.min(100, soma / marcos.length));
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(valor || 0);
}

const inputClass = "w-full rounded-xl border border-surface-border px-3 py-2 text-sm shadow-sm";

export default function ObraListaGestao({
  obras,
  statusDisponiveis,
  cidadesDisponiveis,
  selecionadaId,
  busca,
  onBuscaChange,
  filtroStatus,
  onFiltroStatusChange,
  filtroCidade,
  onFiltroCidadeChange,
  ordenarPor,
  onOrdenarPorChange,
  onSelecionar,
  onNovaObra,
}: Props) {
  return (
    <aside className="flex w-full max-w-sm shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-surface-border bg-surface-soft p-4">
      <button
        onClick={onNovaObra}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover"
      >
        + Nova obra
      </button>

      <input
        placeholder="Buscar por título, empresa, cidade..."
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        className={inputClass}
      />

      <div className="flex gap-2">
        <select value={filtroStatus} onChange={(e) => onFiltroStatusChange(e.target.value)} className={`${inputClass} flex-1`}>
          <option value="">Todos os status</option>
          {statusDisponiveis.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={filtroCidade} onChange={(e) => onFiltroCidadeChange(e.target.value)} className={`${inputClass} flex-1`}>
          <option value="">Todas as cidades</option>
          {cidadesDisponiveis.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <select
        value={ordenarPor}
        onChange={(e) => onOrdenarPorChange(e.target.value as "titulo" | "dataInicio")}
        className={inputClass}
      >
        <option value="titulo">Ordenar por título</option>
        <option value="dataInicio">Ordenar por data de início</option>
      </select>

      <div className="flex flex-col gap-2">
        {obras.length === 0 && <p className="text-sm text-neutral-600">Nenhuma obra encontrada.</p>}
        {obras.map((obra) => {
          const progresso = calcularProgresso(obra.marcos);
          const ativa = obra._id === selecionadaId;
          return (
            <button
              key={obra._id}
              onClick={() => onSelecionar(obra._id)}
              className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left shadow-sm transition ${
                ativa ? "border-primary bg-white ring-2 ring-primary" : "border-surface-border bg-white hover:border-primary"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-900">{obra.titulo}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClasses(obra.status)}`}>
                  {obra.status}
                </span>
              </div>
              <span className="text-xs text-neutral-600">
                {obra.endereco?.cidade || "Cidade não informada"} · R$ {formatarMoeda(obra.valorContratado)}
              </span>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full bg-primary" style={{ width: `${progresso}%` }} />
              </div>
              <span className="text-xs text-neutral-600">
                {progresso.toFixed(0)}% concluído · {obra.feedbacks?.length ?? 0} feedback(s)
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
