import type { Obra } from "../../api/types";

interface Props {
  obra: Obra | null;
}

export default function ObraFeedbacksTab({ obra }: Props) {
  if (!obra) {
    return <p className="text-neutral-600">Salve a obra para começar a receber feedbacks dos cidadãos.</p>;
  }

  return (
    <div className="rounded-xl bg-surface-soft p-4">
      {(!obra.feedbacks || obra.feedbacks.length === 0) && <p className="text-neutral-700">Nenhum feedback registrado.</p>}
      <div className="flex flex-col gap-3">
        {obra.feedbacks?.map((f, i) => (
          <div key={i} className="rounded-xl border border-surface-border bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <h4 className="font-semibold">{f.titulo}</h4>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-neutral-700">{f.tipo}</span>
            </div>
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
  );
}
