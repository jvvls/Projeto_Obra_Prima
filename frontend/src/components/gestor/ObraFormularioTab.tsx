import { useEffect, useRef, useState } from "react";
import type { Marco, Obra } from "../../api/types";

interface Props {
  obra: Obra | null;
  salvando: boolean;
  erroSalvar: string | null;
  onSalvar: (payload: Partial<Obra>) => void;
  onExcluir?: () => void;
  onSujoChange?: (sujo: boolean) => void;
}

const STATUS_OPCOES = ["Planejada", "Em andamento", "Paralisada", "Concluída"];

type FormObra = {
  titulo: string;
  descricao: string;
  valorContratado: string;
  status: string;
  dataInicio: string;
  previsaoTermino: string;
  orgaoResponsavel: string;
  empresaExecutora: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

function obraParaForm(obra: Obra | null): FormObra {
  return {
    titulo: obra?.titulo || "",
    descricao: obra?.descricao || "",
    valorContratado: obra ? String(obra.valorContratado ?? "") : "",
    status: obra?.status || "Planejada",
    dataInicio: obra?.dataInicio || "",
    previsaoTermino: obra?.previsaoTermino || "",
    orgaoResponsavel: obra?.orgaoResponsavel || "",
    empresaExecutora: obra?.empresaExecutora || "",
    logradouro: obra?.endereco?.logradouro || "",
    numero: obra?.endereco?.numero || "",
    bairro: obra?.endereco?.bairro || "",
    cidade: obra?.endereco?.cidade || "",
    estado: obra?.endereco?.estado || "",
    cep: obra?.endereco?.cep || "",
  };
}

const MARCO_VAZIO = { titulo: "", descricao: "", percentual: "0", data: new Date().toISOString().split("T")[0] };

function calcularProgresso(marcos: Marco[]) {
  if (!marcos.length) return 0;
  const soma = marcos.reduce((acc, m) => acc + (Number(m.percentual) || 0), 0);
  return Math.max(0, Math.min(100, soma / marcos.length));
}

const inputClass = "w-full rounded-xl border border-surface-border px-3 py-2 text-sm shadow-sm";
const labelClass = "mb-1 block text-sm font-semibold text-primary";

export default function ObraFormularioTab({ obra, salvando, erroSalvar, onSalvar, onExcluir, onSujoChange }: Props) {
  const [form, setForm] = useState<FormObra>(() => obraParaForm(obra));
  const [marcos, setMarcos] = useState<Marco[]>(() => (obra?.marcos ? [...obra.marcos] : []));
  const [marcoForm, setMarcoForm] = useState(MARCO_VAZIO);
  const [marcoEditIndex, setMarcoEditIndex] = useState<number | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    onSujoChange?.(true);
  }, [form, marcos]);

  const progresso = calcularProgresso(marcos);

  function adicionarMarco() {
    const titulo = marcoForm.titulo.trim();
    const percentual = Number(marcoForm.percentual) || 0;
    if (!titulo) {
      setErroLocal("Título do marco é obrigatório.");
      return;
    }
    if (percentual < 0 || percentual > 100) {
      setErroLocal("Porcentagem do marco deve estar entre 0 e 100.");
      return;
    }
    setErroLocal(null);
    setMarcos((prev) => [...prev, { titulo, descricao: marcoForm.descricao.trim(), percentual, data: marcoForm.data }]);
    setMarcoForm(MARCO_VAZIO);
  }

  function iniciarEdicaoMarco(index: number) {
    const m = marcos[index];
    setMarcoEditIndex(index);
    setMarcoForm({ titulo: m.titulo, descricao: m.descricao, percentual: String(m.percentual), data: m.data });
  }

  function salvarEdicaoMarco() {
    if (marcoEditIndex === null) return;
    const titulo = marcoForm.titulo.trim();
    const percentual = Number(marcoForm.percentual) || 0;
    if (!titulo) {
      setErroLocal("Título do marco é obrigatório.");
      return;
    }
    setErroLocal(null);
    setMarcos((prev) =>
      prev.map((m, i) => (i === marcoEditIndex ? { titulo, descricao: marcoForm.descricao.trim(), percentual, data: marcoForm.data } : m))
    );
    setMarcoEditIndex(null);
    setMarcoForm(MARCO_VAZIO);
  }

  function removerMarco(index: number) {
    setMarcos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSalvar() {
    if (!form.titulo.trim()) {
      setErroLocal("Título é obrigatório.");
      return;
    }
    setErroLocal(null);
    const payload: Partial<Obra> = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      valorContratado: parseFloat(form.valorContratado) || 0,
      status: form.status,
      dataInicio: form.dataInicio,
      previsaoTermino: form.previsaoTermino,
      orgaoResponsavel: form.orgaoResponsavel.trim(),
      empresaExecutora: form.empresaExecutora.trim(),
      endereco: {
        logradouro: form.logradouro,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
      },
      marcos,
      anexos: obra?.anexos ?? [],
      feedbacks: obra?.feedbacks ?? [],
    };
    onSalvar(payload);
  }

  const erroExibido = erroLocal || erroSalvar;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelClass}>Título *</label>
        <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Descrição</label>
        <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={`${inputClass} min-h-[80px]`} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={labelClass}>Valor Contratado (R$)</label>
          <input type="number" step="0.01" value={form.valorContratado} onChange={(e) => setForm({ ...form, valorContratado: e.target.value })} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
            {STATUS_OPCOES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={labelClass}>Data de Início</label>
          <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Previsão de Término</label>
          <input type="date" value={form.previsaoTermino} onChange={(e) => setForm({ ...form, previsaoTermino: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={labelClass}>Órgão Responsável</label>
          <input value={form.orgaoResponsavel} onChange={(e) => setForm({ ...form, orgaoResponsavel: e.target.value })} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Empresa Executora</label>
          <input value={form.empresaExecutora} onChange={(e) => setForm({ ...form, empresaExecutora: e.target.value })} className={inputClass} />
        </div>
      </div>

      <h3 className="mt-2 font-bold text-primary">Endereço</h3>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={labelClass}>Logradouro</label>
          <input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} className={inputClass} />
        </div>
        <div className="sm:w-32">
          <label className={labelClass}>Número</label>
          <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={labelClass}>Bairro</label>
          <input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Cidade</label>
          <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:w-32">
          <label className={labelClass}>Estado</label>
          <input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={inputClass} />
        </div>
        <div className="sm:w-40">
          <label className={labelClass}>CEP</label>
          <input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className={inputClass} />
        </div>
      </div>

      <h3 className="mt-3 font-bold text-primary">Linha do tempo da obra</h3>

      <div className="rounded-xl border border-surface-border p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className={labelClass}>Título do marco</label>
            <input value={marcoForm.titulo} onChange={(e) => setMarcoForm({ ...marcoForm, titulo: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:w-32">
            <label className={labelClass}>Porcentagem</label>
            <input type="number" min={0} max={100} value={marcoForm.percentual} onChange={(e) => setMarcoForm({ ...marcoForm, percentual: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className={labelClass}>Descrição</label>
            <textarea value={marcoForm.descricao} onChange={(e) => setMarcoForm({ ...marcoForm, descricao: e.target.value })} className={`${inputClass} min-h-[60px]`} />
          </div>
          <div className="sm:w-40">
            <label className={labelClass}>Data</label>
            <input type="date" value={marcoForm.data} onChange={(e) => setMarcoForm({ ...marcoForm, data: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {marcoEditIndex === null ? (
            <button onClick={adicionarMarco} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
              Adicionar marco
            </button>
          ) : (
            <button onClick={salvarEdicaoMarco} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
              Salvar marco
            </button>
          )}
          <button
            onClick={() => {
              setMarcoForm(MARCO_VAZIO);
              setMarcoEditIndex(null);
            }}
            className="rounded-xl border border-primary px-3 py-2 text-sm text-primary"
          >
            Limpar marco
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-surface-soft p-3">
          <div className="mb-1 flex justify-between">
            <strong>Marcos</strong>
            <span>{progresso.toFixed(0)}%</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full bg-primary" style={{ width: `${progresso}%` }} />
          </div>

          {marcos.length === 0 && <p className="text-sm text-neutral-600">Nenhum marco adicionado ainda.</p>}
          <div className="flex flex-col gap-2">
            {marcos.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-surface-border bg-white p-2.5 shadow-sm">
                <div>
                  <div className="font-semibold">{m.titulo}</div>
                  <div className="text-sm text-neutral-600">
                    Concluído: {Number(m.percentual).toFixed(0)}%{m.data ? ` · Data: ${m.data}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => iniciarEdicaoMarco(i)} className="text-sm text-primary hover:underline">
                    Editar
                  </button>
                  <button onClick={() => removerMarco(i)} className="text-sm text-red-600 hover:underline">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {erroExibido && <p className="text-sm font-semibold text-red-600">{erroExibido}</p>}

      <div className="mt-2 flex flex-wrap gap-3">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {onExcluir && (
          <button onClick={onExcluir} className="rounded-xl border border-red-500 px-4 py-2 font-semibold text-red-600 hover:bg-red-50">
            Excluir obra
          </button>
        )}
      </div>
    </div>
  );
}
