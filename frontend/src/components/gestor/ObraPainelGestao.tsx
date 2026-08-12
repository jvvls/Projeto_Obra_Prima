import type { Obra } from "../../api/types";
import ObraFormularioTab from "./ObraFormularioTab";

interface Props {
  obra: Obra | null;
  modo: "vazio" | "novo" | "edicao";
  salvando: boolean;
  erroSalvar: string | null;
  onSalvar: (payload: Partial<Obra>) => void;
  onExcluir: () => void;
  onNovaObra: () => void;
}

export default function ObraPainelGestao({ obra, modo, salvando, erroSalvar, onSalvar, onExcluir, onNovaObra }: Props) {
  if (modo === "vazio") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center shadow-sm">
        <p className="text-neutral-600">Selecione uma obra na lista ao lado ou cadastre uma nova.</p>
        <button onClick={onNovaObra} className="rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow-sm hover:bg-primary-hover">
          + Nova obra
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-primary">{modo === "novo" ? "Cadastrar Obra" : obra?.titulo}</h2>
      <ObraFormularioTab
        key={obra?._id ?? "novo"}
        obra={obra}
        salvando={salvando}
        erroSalvar={erroSalvar}
        onSalvar={onSalvar}
        onExcluir={modo === "edicao" ? onExcluir : undefined}
      />
    </div>
  );
}
