import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { atualizarObra, criarObra, excluirObra, listarObras } from "../api/obras";
import type { Marco, Obra } from "../api/types";

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

const FORM_VAZIO: FormObra = {
  titulo: "",
  descricao: "",
  valorContratado: "",
  status: "Planejada",
  dataInicio: "",
  previsaoTermino: "",
  orgaoResponsavel: "",
  empresaExecutora: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

const MARCO_VAZIO = { titulo: "", descricao: "", percentual: "0", data: new Date().toISOString().split("T")[0] };

function calcularProgresso(marcos: Marco[]) {
  if (!marcos.length) return 0;
  const soma = marcos.reduce((acc, m) => acc + (Number(m.percentual) || 0), 0);
  return Math.max(0, Math.min(100, soma / marcos.length));
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0);
}

const inputClass = "w-full rounded-lg border border-surface-border px-2.5 py-2 text-sm";
const labelClass = "mb-1 block text-sm font-semibold text-primary";

export default function EditorObras() {
  const { usuario, carregando, logout } = useAuth();
  const navigate = useNavigate();

  const [obras, setObras] = useState<Obra[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormObra>(FORM_VAZIO);
  const [marcos, setMarcos] = useState<Marco[]>([]);
  const [marcoForm, setMarcoForm] = useState(MARCO_VAZIO);
  const [marcoEditIndex, setMarcoEditIndex] = useState<number | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<"titulo" | "dataInicio">("titulo");

  useEffect(() => {
    if (carregando) return;
    if (!usuario) navigate("/login");
  }, [carregando, usuario, navigate]);

  useEffect(() => {
    if (!usuario?.gestor) return;
    listarObras()
      .then(setObras)
      .catch((err) => setErro(err.message));
  }, [usuario]);

  const cidadesDisponiveis = useMemo(
    () => Array.from(new Set(obras.map((o) => o.endereco?.cidade).filter(Boolean))).sort() as string[],
    [obras]
  );
  const statusDisponiveis = useMemo(
    () => Array.from(new Set(obras.map((o) => o.status).filter(Boolean))).sort(),
    [obras]
  );

  const obrasFiltradas = useMemo(() => {
    let resultado = [...obras];
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      resultado = resultado.filter((o) =>
        [o.titulo, o.descricao, o.empresaExecutora, o.endereco?.cidade, o.endereco?.logradouro, o.orgaoResponsavel]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (filtroStatus) resultado = resultado.filter((o) => o.status === filtroStatus);
    if (filtroCidade) resultado = resultado.filter((o) => o.endereco?.cidade === filtroCidade);

    if (ordenarPor === "dataInicio") {
      resultado.sort((a, b) => new Date(a.dataInicio || 0).getTime() - new Date(b.dataInicio || 0).getTime());
    } else {
      resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
    }
    return resultado;
  }, [obras, busca, filtroStatus, filtroCidade, ordenarPor]);

  function limparFormulario() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setMarcos([]);
    setMarcoForm(MARCO_VAZIO);
    setMarcoEditIndex(null);
  }

  function carregarParaEdicao(obra: Obra) {
    setEditandoId(obra._id);
    setForm({
      titulo: obra.titulo || "",
      descricao: obra.descricao || "",
      valorContratado: String(obra.valorContratado ?? ""),
      status: obra.status || "Planejada",
      dataInicio: obra.dataInicio || "",
      previsaoTermino: obra.previsaoTermino || "",
      orgaoResponsavel: obra.orgaoResponsavel || "",
      empresaExecutora: obra.empresaExecutora || "",
      logradouro: obra.endereco?.logradouro || "",
      numero: obra.endereco?.numero || "",
      bairro: obra.endereco?.bairro || "",
      cidade: obra.endereco?.cidade || "",
      estado: obra.endereco?.estado || "",
      cep: obra.endereco?.cep || "",
    });
    setMarcos(obra.marcos ? [...obra.marcos] : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function adicionarMarco() {
    const titulo = marcoForm.titulo.trim();
    const percentual = Number(marcoForm.percentual) || 0;
    if (!titulo) {
      setErro("Título do marco é obrigatório.");
      return;
    }
    if (percentual < 0 || percentual > 100) {
      setErro("Porcentagem do marco deve estar entre 0 e 100.");
      return;
    }
    setErro(null);
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
      setErro("Título do marco é obrigatório.");
      return;
    }
    setErro(null);
    setMarcos((prev) =>
      prev.map((m, i) => (i === marcoEditIndex ? { titulo, descricao: marcoForm.descricao.trim(), percentual, data: marcoForm.data } : m))
    );
    setMarcoEditIndex(null);
    setMarcoForm(MARCO_VAZIO);
  }

  function removerMarco(index: number) {
    setMarcos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSalvarObra() {
    if (!form.titulo.trim()) {
      setErro("Título é obrigatório.");
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
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
        anexos: [],
      };

      if (editandoId) {
        const existente = obras.find((o) => o._id === editandoId);
        payload.feedbacks = existente?.feedbacks ?? [];
        const atualizada = await atualizarObra(editandoId, payload);
        setObras((prev) => prev.map((o) => (o._id === atualizada._id ? atualizada : o)));
      } else {
        payload.feedbacks = [];
        const criada = await criarObra(payload);
        setObras((prev) => [...prev, criada]);
      }
      limparFormulario();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirObra(id: string) {
    if (!window.confirm("Deseja excluir esta obra?")) return;
    try {
      await excluirObra(id);
      setObras((prev) => prev.filter((o) => o._id !== id));
      if (editandoId === id) limparFormulario();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (carregando || !usuario) {
    return <div className="p-8 text-neutral-700">Carregando...</div>;
  }

  if (!usuario.gestor) {
    return (
      <div className="p-8 text-center">
        <p className="mb-3 text-lg font-semibold text-red-600">Acesso restrito a gestores.</p>
        <button onClick={() => navigate("/main")} className="text-primary hover:underline">
          Voltar para o painel principal
        </button>
      </div>
    );
  }

  const progresso = calcularProgresso(marcos);

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="flex items-center gap-4 bg-primary px-5 py-2.5 text-white shadow">
        <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
        <div className="flex-1 text-lg font-bold">Obra Prima — Editor</div>
        <button onClick={() => navigate("/main")} className="rounded-lg border border-white px-3 py-1.5">
          Página Inicial
        </button>
        <button onClick={handleLogout} className="rounded-lg border border-white px-3 py-1.5">
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-6">
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-primary">
            {editandoId ? "Editar Obra" : "Cadastrar Obra"}
          </h2>

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

            <div className="rounded-lg border border-surface-border p-3">
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
                  <button onClick={adicionarMarco} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
                    Adicionar marco
                  </button>
                ) : (
                  <button onClick={salvarEdicaoMarco} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
                    Salvar marco
                  </button>
                )}
                <button
                  onClick={() => {
                    setMarcoForm(MARCO_VAZIO);
                    setMarcoEditIndex(null);
                  }}
                  className="rounded-lg border border-primary px-3 py-2 text-sm text-primary"
                >
                  Limpar marco
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-surface-soft p-3">
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
                    <div key={i} className="flex items-center justify-between rounded-lg border border-surface-border bg-white p-2.5">
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

            {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

            <div className="mt-2 flex gap-3">
              <button onClick={limparFormulario} className="rounded-lg border border-primary px-3 py-2 font-semibold text-primary">
                Novo
              </button>
              <button
                onClick={handleSalvarObra}
                disabled={salvando}
                className="rounded-lg bg-primary px-3 py-2 font-semibold text-white disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-primary">Obras Cadastradas</h2>

          <div className="mb-4 flex flex-wrap gap-3">
            <input
              placeholder="Título, empresa, cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`${inputClass} min-w-[200px] flex-1`}
            />
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className={`${inputClass} w-auto`}>
              <option value="">Todos os status</option>
              {statusDisponiveis.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className={`${inputClass} w-auto`}>
              <option value="">Todas as cidades</option>
              {cidadesDisponiveis.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value as "titulo" | "dataInicio")} className={`${inputClass} w-auto`}>
              <option value="titulo">Ordenar por Título</option>
              <option value="dataInicio">Ordenar por Data de Início</option>
            </select>
          </div>

          {obrasFiltradas.length === 0 && <p className="text-sm text-neutral-600">Nenhuma obra encontrada com os filtros aplicados.</p>}

          <div className="flex flex-col gap-3">
            {obrasFiltradas.map((obra) => {
              const prog = calcularProgresso(obra.marcos || []);
              return (
                <div key={obra._id} className="rounded-lg border border-surface-border p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold">{obra.titulo}</h3>
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs text-white">{obra.status}</span>
                  </div>
                  <p className="mb-1 text-sm text-neutral-700">{obra.descricao}</p>
                  <p className="text-sm">
                    <strong>Cidade:</strong> {obra.endereco?.cidade || "-"}
                  </p>
                  <p className="text-sm">
                    <strong>Valor contratado:</strong> R$ {formatarMoeda(obra.valorContratado)}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full bg-primary" style={{ width: `${prog}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">{prog.toFixed(0)}% concluído</p>

                  <p className="mt-2 text-xs text-neutral-600">
                    {obra.feedbacks?.length ?? 0} feedback(s) recebido(s)
                  </p>

                  <div className="mt-3 flex gap-3">
                    <button onClick={() => carregarParaEdicao(obra)} className="text-sm text-primary hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleExcluirObra(obra._id)} className="text-sm text-red-600 hover:underline">
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
