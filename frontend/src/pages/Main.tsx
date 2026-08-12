import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarObras } from "../api/obras";
import type { Obra } from "../api/types";
import ObraDetalhesPanel from "../components/ObraDetalhesPanel";

const placeholder = "/assets/images/Logo2.png";
const formatCurrency = (value: number) => "R$ " + Number(value || 0).toLocaleString("pt-BR");
const normalize = (str: string | undefined) =>
  str ? str.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase() : "";

const CUSTO_MIN = 100000;
const CUSTO_MAX = 10000000;

function getFirstImageUrl(obra: Obra) {
  const imagem = obra.anexos?.find((a) => a.tipo === "imagem");
  return imagem?.url || placeholder;
}

export default function Main() {
  const { usuario, carregando, logout } = useAuth();
  const navigate = useNavigate();

  const [obras, setObras] = useState<Obra[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [obraSelecionada, setObraSelecionada] = useState<Obra | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [visao, setVisao] = useState<"grid" | "lista">("grid");

  const [nome, setNome] = useState("");
  const [custoMax, setCustoMax] = useState(CUSTO_MAX);
  const [status, setStatus] = useState("Todas");
  const [bairro, setBairro] = useState("Todas");
  const [construtora, setConstrutora] = useState("Todas");

  useEffect(() => {
    if (carregando) return;
    if (!usuario) {
      navigate("/login");
    }
  }, [carregando, usuario, navigate]);

  useEffect(() => {
    listarObras()
      .then(setObras)
      .catch((err) => setErro(err.message));
  }, []);

  const opcoes = useMemo(
    () => ({
      status: Array.from(new Set(obras.map((o) => o.status).filter(Boolean))).sort(),
      bairro: Array.from(new Set(obras.map((o) => o.endereco?.bairro).filter(Boolean))).sort() as string[],
      construtora: Array.from(new Set(obras.map((o) => o.empresaExecutora).filter(Boolean))).sort(),
    }),
    [obras]
  );

  const filtradas = useMemo(() => {
    const nomeN = normalize(nome);
    const bairroN = bairro !== "Todas" ? normalize(bairro) : "";
    const construtoraN = construtora !== "Todas" ? normalize(construtora) : "";
    const statusN = status !== "Todas" ? normalize(status) : "";

    return obras.filter((obra) => {
      const matchNome = !nomeN || normalize(obra.titulo).includes(nomeN);
      const matchBairro = !bairroN || normalize(obra.endereco?.bairro).includes(bairroN);
      const matchConstrutora = !construtoraN || normalize(obra.empresaExecutora).includes(construtoraN);
      const matchStatus = !statusN || normalize(obra.status).includes(statusN);
      const matchCusto = (obra.valorContratado ?? 0) <= custoMax;
      return matchNome && matchBairro && matchConstrutora && matchStatus && matchCusto;
    });
  }, [obras, nome, bairro, construtora, status, custoMax]);

  function limparFiltros() {
    setNome("");
    setStatus("Todas");
    setBairro("Todas");
    setConstrutora("Todas");
    setCustoMax(CUSTO_MAX);
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function handleObraAtualizada(obraAtualizada: Obra) {
    setObras((prev) => prev.map((o) => (o._id === obraAtualizada._id ? obraAtualizada : o)));
    setObraSelecionada(obraAtualizada);
  }

  if (carregando || !usuario) {
    return <div className="p-8 text-neutral-700">Carregando...</div>;
  }

  const primeiroNome = usuario.dadosPessoais.nomeCompleto.split(" ")[0];

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center gap-4 bg-primary px-5 py-2.5 text-white shadow">
        <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
        <div className="flex-1 text-lg font-bold">Obra Prima</div>
        <div className="relative">
          <button
            onClick={() => setDropdownAberto((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-white px-3 py-1.5"
          >
            <span>{primeiroNome}</span>
            <span>▼</span>
          </button>
          {dropdownAberto && (
            <div className="absolute right-0 top-full z-30 mt-1 flex w-44 flex-col rounded-lg bg-white text-neutral-900 shadow-lg">
              <button onClick={() => navigate("/")} className="px-4 py-2.5 text-left hover:bg-surface-muted">
                Página Inicial
              </button>
              <button onClick={handleLogout} className="px-4 py-2.5 text-left hover:bg-surface-muted">
                Sair
              </button>
            </div>
          )}
        </div>
        {usuario.gestor && (
          <button
            onClick={() => navigate("/editor")}
            className="rounded-lg bg-blue-500 px-3 py-1.5 font-bold text-white"
          >
            Painel do Gestor
          </button>
        )}
      </header>

      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-surface-border bg-surface-soft p-4">
          <button
            onClick={() => setVisao((v) => (v === "grid" ? "lista" : "grid"))}
            className="mb-4 flex w-full flex-col items-center gap-1 rounded-lg border border-surface-border bg-white p-3 hover:bg-surface-muted"
          >
            <img src="/assets/images/Maps.png" alt="Mapa" className="h-10" />
            <span className="text-sm">{visao === "grid" ? "Ver endereços" : "Ver em grade"}</span>
          </button>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-neutral-700">Nome da Obra</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome"
              className="w-full rounded-lg border border-surface-border p-2 text-sm"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-neutral-700">Custo da Obra (R$)</label>
            <input
              type="range"
              min={CUSTO_MIN}
              max={CUSTO_MAX}
              step={10000}
              value={custoMax}
              onChange={(e) => setCustoMax(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-neutral-700">{formatCurrency(custoMax)}</span>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-neutral-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-surface-border p-2 text-sm">
              <option>Todas</option>
              {opcoes.status.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-neutral-700">Bairro</label>
            <select value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full rounded-lg border border-surface-border p-2 text-sm">
              <option>Todas</option>
              {opcoes.bairro.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-neutral-700">Construtora</label>
            <select value={construtora} onChange={(e) => setConstrutora(e.target.value)} className="w-full rounded-lg border border-surface-border p-2 text-sm">
              <option>Todas</option>
              {opcoes.construtora.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <button onClick={limparFiltros} className="w-full rounded-lg border border-primary p-2 text-sm text-primary">
            Limpar Filtro
          </button>
        </aside>

        <main className="flex-1 p-5">
          {erro && <p className="text-red-600">Erro ao buscar obras: {erro}</p>}
          {!erro && filtradas.length === 0 && <p className="text-neutral-700">Nenhuma obra encontrada.</p>}

          {visao === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
              {filtradas.map((obra) => (
                <div key={obra._id} className="rounded-xl border border-surface-border bg-white p-3 shadow-sm">
                  <img
                    src={getFirstImageUrl(obra)}
                    alt="obra"
                    loading="lazy"
                    className="mb-2.5 h-32 w-full rounded-lg object-cover"
                  />
                  <h3 className="mb-2 text-primary">{obra.titulo}</h3>
                  <button
                    onClick={() => setObraSelecionada(obra)}
                    className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white"
                  >
                    Ver detalhes
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtradas.map((obra) => (
                <div
                  key={obra._id}
                  onClick={() => setObraSelecionada(obra)}
                  className="cursor-pointer rounded-lg border border-surface-border bg-white p-3 hover:bg-surface-muted"
                >
                  <strong className="text-primary">{obra.titulo}</strong>
                  <p className="text-sm text-neutral-700">
                    {obra.endereco?.logradouro}, {obra.endereco?.numero} — {obra.endereco?.bairro}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {obraSelecionada && (
        <ObraDetalhesPanel
          obra={obraSelecionada}
          usuario={usuario}
          onClose={() => setObraSelecionada(null)}
          onObraAtualizada={handleObraAtualizada}
        />
      )}
    </div>
  );
}
