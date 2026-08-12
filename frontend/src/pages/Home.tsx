import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarObras } from "../api/obras";
import type { Obra } from "../api/types";

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(valor || 0);
}

export default function Home() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarObras()
      .then(setObras)
      .catch((err) => setErro(err.message));
  }, []);

  const primeiroNome = usuario?.dadosPessoais.nomeCompleto?.split(" ")[0] || "Usuário";

  const totalFeedbacks = useMemo(
    () => (obras ?? []).reduce((acc, o) => acc + (o.feedbacks?.length ?? 0), 0),
    [obras]
  );

  const situacao = useMemo(() => {
    const lista = obras ?? [];
    const concluidas = lista.filter((o) => o.status.toLowerCase().includes("conclu")).length;
    const andamento = lista.filter((o) => o.status.toLowerCase().includes("andamento")).length;
    const paralisadas = lista.filter((o) => o.status.toLowerCase().includes("paralis")).length;
    return { concluidas, andamento, paralisadas };
  }, [obras]);

  const destaque = useMemo(() => {
    return [...(obras ?? [])]
      .sort((a, b) => {
        const da = a.dataInicio ? new Date(a.dataInicio).getTime() : 0;
        const db = b.dataInicio ? new Date(b.dataInicio).getTime() : 0;
        if (db !== da) return db - da;
        return (b.valorContratado || 0) - (a.valorContratado || 0);
      })
      .slice(0, 3);
  }, [obras]);

  async function handleLogout() {
    if (!window.confirm("Deseja realmente sair?")) return;
    await logout();
  }

  const maiorSituacao = Math.max(situacao.concluidas, situacao.andamento, situacao.paralisadas, 1);

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between bg-primary px-5 py-2.5 text-white shadow">
        <div className="flex items-center gap-2.5">
          <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
          <span className="text-lg font-bold">OBRA PRIMA – Portal de Obras Públicas</span>
        </div>
        <div className="flex items-center gap-4">
          {usuario ? (
            <div className="flex items-center gap-2.5">
              <span className="font-bold">{primeiroNome}</span>
              <button
                className="rounded-lg border border-white px-3 py-1.5 font-semibold"
                onClick={() => navigate("/main")}
              >
                Ver Obras
              </button>
              <button className="rounded-lg border border-white px-3 py-1.5 font-semibold" onClick={handleLogout}>
                Sair
              </button>
            </div>
          ) : (
            <button className="rounded-lg border border-white px-3 py-1.5 font-semibold" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </header>

      <section className="mt-20 bg-gradient-to-br from-primary to-primary-dark px-5 py-16 text-center text-white">
        <h1 className="mb-2.5 text-3xl">
          {usuario ? `Bem-vindo, ${primeiroNome}!` : "Acompanhe as Obras Públicas da Cidade"}
        </h1>
        <p className="text-base opacity-90">
          {usuario
            ? "Acompanhe as obras públicas da sua cidade."
            : "Faça login para acessar todas as funcionalidades do sistema."}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {usuario ? (
            <button
              className="rounded-lg bg-white px-6 py-3 font-semibold text-primary"
              onClick={() => navigate("/main")}
            >
              Ver Todas as Obras
            </button>
          ) : (
            <button
              className="rounded-lg bg-white px-6 py-3 font-semibold text-primary"
              onClick={() => navigate("/login")}
            >
              Fazer Login para Acessar
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-wrap gap-5 px-5 py-10">
        <div className="w-full rounded-xl border border-surface-border bg-surface-soft p-5 text-center shadow-sm sm:w-[calc(50%-10px)]">
          <h2 className="mb-1.5 text-lg text-primary">Total de Obras</h2>
          <p className="text-3xl font-bold text-neutral-900">{obras?.length ?? 0}</p>
        </div>
        <div className="w-full rounded-xl border border-surface-border bg-surface-soft p-5 text-center shadow-sm sm:w-[calc(50%-10px)]">
          <h2 className="mb-1.5 text-lg text-primary">Feedbacks Enviados</h2>
          <p className="text-3xl font-bold text-neutral-900">{totalFeedbacks}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-2.5">
        <div className="rounded-xl border border-surface-border bg-surface-soft p-5 shadow-sm">
          <h2 className="mb-4 text-xl text-primary">Situação Geral das Obras</h2>
          <div className="space-y-3">
            {[
              { label: "Concluídas", valor: situacao.concluidas, cor: "bg-primary" },
              { label: "Em andamento", valor: situacao.andamento, cor: "bg-amber-400" },
              { label: "Paralisadas", valor: situacao.paralisadas, cor: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-neutral-700">{item.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-surface-muted">
                  <div
                    className={`h-full ${item.cor}`}
                    style={{ width: `${(item.valor / maiorSituacao) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-sm font-semibold text-neutral-900">{item.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <h2 className="mb-3 text-xl font-bold text-primary">Obras em Destaque</h2>
        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            <p className="font-bold">Não foi possível carregar os dados das obras.</p>
            <small className="text-neutral-600">{erro}</small>
          </div>
        )}
        {!erro && obras === null && <p className="text-neutral-700">Carregando...</p>}
        {!erro && obras !== null && destaque.length === 0 && (
          <div className="rounded-xl border border-surface-border bg-surface-soft p-5">Nenhuma obra de destaque.</div>
        )}
        <div className="flex flex-wrap gap-5">
          {destaque.map((obra) => (
            <div
              key={obra._id}
              onClick={() => navigate("/main")}
              className="flex-1 basis-full cursor-pointer rounded-xl border border-surface-border bg-white p-4.5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:basis-[calc(33%-20px)]"
            >
              <h3 className="mb-1.5 text-lg text-primary">{obra.titulo || "(Sem título)"}</h3>
              <p className="mt-1 text-sm text-neutral-700">
                <strong>Status:</strong> {obra.status || "—"}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                <strong>Local:</strong> {obra.endereco?.bairro || "—"} — {obra.endereco?.cidade || "—"}
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                <strong>Valor:</strong> R$ {formatarMoeda(obra.valorContratado)}
              </p>
              <div className="mt-4 border-t border-surface-border pt-2.5 text-center">
                <small className="italic text-neutral-600">Clique para ver detalhes</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
