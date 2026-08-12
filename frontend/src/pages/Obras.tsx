import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarObras } from "../api/obras";
import type { Obra } from "../api/types";

const TODAS = "Todas";

export default function Obras() {
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState(TODAS);
  const [bairro, setBairro] = useState(TODAS);
  const [construtora, setConstrutora] = useState(TODAS);

  useEffect(() => {
    listarObras()
      .then(setObras)
      .catch((err) => setErro(err.message));
  }, []);

  const opcoes = useMemo(() => {
    const lista = obras ?? [];
    return {
      status: Array.from(new Set(lista.map((o) => o.status).filter(Boolean))),
      bairro: Array.from(new Set(lista.map((o) => o.endereco?.bairro).filter(Boolean))) as string[],
      construtora: Array.from(new Set(lista.map((o) => o.empresaExecutora).filter(Boolean))),
    };
  }, [obras]);

  const filtradas = useMemo(() => {
    const nomeFiltro = nome.toLowerCase();
    return (obras ?? []).filter((o) => {
      const matchNome = nomeFiltro === "" || o.titulo?.toLowerCase().includes(nomeFiltro);
      const matchStatus = status === TODAS || o.status === status;
      const matchBairro = bairro === TODAS || o.endereco?.bairro === bairro;
      const matchConstrutora = construtora === TODAS || o.empresaExecutora === construtora;
      return matchNome && matchStatus && matchBairro && matchConstrutora;
    });
  }, [obras, nome, status, bairro, construtora]);

  function limparFiltros() {
    setNome("");
    setStatus(TODAS);
    setBairro(TODAS);
    setConstrutora(TODAS);
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between bg-primary px-5 text-white shadow">
        <div className="flex items-center gap-2.5">
          <img src="/assets/images/Logo.png" alt="Logo" className="h-10" />
          <span className="text-lg font-bold">OBRA PRIMA – Obras Públicas</span>
        </div>
        <button className="rounded-lg bg-white px-3.5 py-2 font-bold text-primary" onClick={() => navigate("/")}>
          Início
        </button>
      </header>

      <div className="mt-[70px] flex">
        <aside className="h-[calc(100vh-70px)] w-[260px] overflow-y-auto border border-surface-border bg-surface-soft p-5">
          <h3 className="mb-4 text-primary">Filtros</h3>

          <div className="mb-4">
            <label className="mb-1 block text-sm">Nome da Obra</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-neutral-400 px-2 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-neutral-400 px-2 py-2">
              <option>{TODAS}</option>
              {opcoes.status.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm">Bairro</label>
            <select value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full rounded-md border border-neutral-400 px-2 py-2">
              <option>{TODAS}</option>
              {opcoes.bairro.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm">Construtora</label>
            <select value={construtora} onChange={(e) => setConstrutora(e.target.value)} className="w-full rounded-md border border-neutral-400 px-2 py-2">
              <option>{TODAS}</option>
              {opcoes.construtora.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={limparFiltros}
            className="mt-2.5 rounded-md border border-primary px-2 py-2 text-primary"
          >
            Limpar Filtros
          </button>
        </aside>

        <main className="flex-1 p-5">
          {erro && <p className="text-red-600">Erro ao buscar obras: {erro}</p>}
          {!erro && obras === null && <p className="text-neutral-700">Carregando...</p>}
          <div className="flex flex-wrap gap-5">
            {filtradas.map((obra) => {
              const valorFormatado = obra.valorContratado
                ? Number(obra.valorContratado).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "—";
              return (
                <div
                  key={obra._id}
                  onClick={() => navigate(`/obras/${obra._id}`)}
                  className="flex-1 basis-full cursor-pointer rounded-xl border border-surface-border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:basis-[calc(33%-20px)]"
                >
                  <img src="/assets/images/Logo2.png" alt="Imagem da obra" className="mb-2.5 h-[140px] w-full rounded-lg object-cover" />
                  <h3 className="mb-1.5 text-primary">{obra.titulo || "(Sem título)"}</h3>
                  <p>
                    <strong>Status:</strong> {obra.status || "—"}
                  </p>
                  <p>
                    <strong>Bairro:</strong> {obra.endereco?.bairro || "—"}
                  </p>
                  <p>
                    <strong>Construtora:</strong> {obra.empresaExecutora || "—"}
                  </p>
                  <p>
                    <strong>Valor:</strong> {valorFormatado}
                  </p>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
