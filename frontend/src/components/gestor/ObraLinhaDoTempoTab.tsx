import type { Obra } from "../../api/types";

interface Props {
  obra: Obra | null;
}

function calcularProgresso(marcos: Obra["marcos"]) {
  if (!marcos || marcos.length === 0) return 0;
  const soma = marcos.reduce((total, marco) => total + (Number(marco.percentual) || 0), 0);
  return Math.round(Math.max(0, Math.min(100, soma / marcos.length)));
}

export default function ObraLinhaDoTempoTab({ obra }: Props) {
  if (!obra) {
    return <p className="text-neutral-600">Salve a obra para acompanhar a linha do tempo publicada.</p>;
  }

  const progresso = calcularProgresso(obra.marcos);
  const marcosOrdenados = [...(obra.marcos ?? [])].sort((a, b) => (a.percentual || 0) - (b.percentual || 0));

  return (
    <div className="rounded-xl bg-surface-soft p-4">
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
          <li key={i} className="rounded-xl border border-surface-border bg-white p-3 shadow-sm">
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
  );
}
