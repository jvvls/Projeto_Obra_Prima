import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { atualizarObra, criarObra, excluirObra, listarObras } from "../api/obras";
import type { Obra } from "../api/types";
import ObraListaGestao from "../components/gestor/ObraListaGestao";
import ObraPainelGestao from "../components/gestor/ObraPainelGestao";

export default function GestaoObras() {
  const { usuario, carregando, logout } = useAuth();
  const navigate = useNavigate();

  const [obras, setObras] = useState<Obra[]>([]);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);
  const [selecaoId, setSelecaoId] = useState<string | "novo" | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<"titulo" | "dataInicio">("titulo");

  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  useEffect(() => {
    if (carregando) return;
    if (!usuario) navigate("/login");
  }, [carregando, usuario, navigate]);

  useEffect(() => {
    if (!usuario?.gestor) return;
    listarObras()
      .then(setObras)
      .catch((err) => setErroCarregar(err.message));
  }, [usuario]);

  const statusDisponiveis = useMemo(
    () => Array.from(new Set(obras.map((o) => o.status).filter(Boolean))).sort(),
    [obras]
  );
  const cidadesDisponiveis = useMemo(
    () => Array.from(new Set(obras.map((o) => o.endereco?.cidade).filter(Boolean))).sort() as string[],
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

  const modo: "vazio" | "novo" | "edicao" = selecaoId === null ? "vazio" : selecaoId === "novo" ? "novo" : "edicao";
  const obraSelecionada = selecaoId && selecaoId !== "novo" ? obras.find((o) => o._id === selecaoId) ?? null : null;

  async function handleSalvarObra(payload: Partial<Obra>) {
    setSalvando(true);
    setErroSalvar(null);
    try {
      if (selecaoId && selecaoId !== "novo") {
        const atualizada = await atualizarObra(selecaoId, payload);
        setObras((prev) => prev.map((o) => (o._id === atualizada._id ? atualizada : o)));
        setSelecaoId(atualizada._id);
      } else {
        const criada = await criarObra(payload);
        setObras((prev) => [...prev, criada]);
        setSelecaoId(criada._id);
      }
    } catch (err) {
      setErroSalvar((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirObra() {
    if (!selecaoId || selecaoId === "novo") return;
    if (!window.confirm("Deseja excluir esta obra?")) return;
    try {
      await excluirObra(selecaoId);
      setObras((prev) => prev.filter((o) => o._id !== selecaoId));
      setSelecaoId(null);
    } catch (err) {
      setErroSalvar((err as Error).message);
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

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="flex items-center gap-4 bg-primary px-5 py-2.5 text-white shadow">
        <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
        <div className="flex-1 text-lg font-bold">Obra Prima — Gestão</div>
        <button onClick={() => navigate("/main")} className="rounded-xl border border-white px-3 py-1.5">
          Página Inicial
        </button>
        <button onClick={handleLogout} className="rounded-xl border border-white px-3 py-1.5">
          Sair
        </button>
      </header>

      {erroCarregar && <p className="px-5 pt-4 text-red-600">Erro ao buscar obras: {erroCarregar}</p>}

      <main className="flex flex-1 gap-4 overflow-hidden p-5">
        <ObraListaGestao
          obras={obrasFiltradas}
          statusDisponiveis={statusDisponiveis}
          cidadesDisponiveis={cidadesDisponiveis}
          selecionadaId={selecaoId === "novo" ? null : selecaoId}
          busca={busca}
          onBuscaChange={setBusca}
          filtroStatus={filtroStatus}
          onFiltroStatusChange={setFiltroStatus}
          filtroCidade={filtroCidade}
          onFiltroCidadeChange={setFiltroCidade}
          ordenarPor={ordenarPor}
          onOrdenarPorChange={setOrdenarPor}
          onSelecionar={(id) => setSelecaoId(id)}
          onNovaObra={() => setSelecaoId("novo")}
        />

        <ObraPainelGestao
          key={selecaoId ?? "vazio"}
          obra={obraSelecionada}
          modo={modo}
          salvando={salvando}
          erroSalvar={erroSalvar}
          onSalvar={handleSalvarObra}
          onExcluir={handleExcluirObra}
          onNovaObra={() => setSelecaoId("novo")}
        />
      </main>
    </div>
  );
}
