# Painel do Gestor Unificado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the gestor's fragmented flow (`/main` browsing + separate `/editor` CRUD page with no feedback visibility) with a single unified `/gestor` page that lists, creates, edits, and shows feedback/timeline for obras in one master-detail screen.

**Architecture:** A new page `GestaoObras.tsx` owns data fetching and top-level state (obras list, filters, current selection). It renders a left list panel (`ObraListaGestao`) and a right detail panel (`ObraPainelGestao`) that switches between three tabs backed by three small components: `ObraFormularioTab` (create/edit + marcos), `ObraLinhaDoTempoTab` (read-only marcos view), `ObraFeedbacksTab` (read-only feedbacks view). The new route is built alongside the existing `/editor` route so the app stays working at every step, then a final task cuts `/editor` over to `/gestor` and deletes the old page.

**Tech Stack:** React 19 + TypeScript, React Router 7, Tailwind CSS. No test framework is configured in this project (`frontend/package.json` has no `test` script) — verification is `npm run build` (runs `tsc -b`, catches type errors), `npm run lint` (oxlint), and manual verification in the browser via `docker compose up --build` (frontend at `http://localhost:5173`, hot-reloads from the mounted `./frontend` volume).

## Global Constraints

- Frontend lives in `frontend/`, uses path-based imports relative to `frontend/src/`. No new npm dependencies are needed for this feature.
- Follow existing code style: function components, no semicolon-omission changes, Tailwind utility classes inline (no CSS modules), Portuguese for all user-facing copy and variable/function names that mirror the domain (`obra`, `marco`, `feedback`, `gestor`), matching every existing page in `frontend/src/pages/`.
- No backend/API changes — reuse `listarObras`, `criarObra`, `atualizarObra`, `excluirObra` from `frontend/src/api/obras.ts` exactly as they are.
- Visual style per the design spec (`docs/superpowers/specs/2026-08-12-painel-gestor-unificado-design.md`): keep the existing `primary` green palette from `frontend/tailwind.config.ts`; use `rounded-xl`/`rounded-2xl` corners and `shadow-sm` consistently (an evolution of the current look, not a repaint); status badges get per-status colors (Concluída=emerald, Em andamento=amber, Paralisada=red, Planejada=neutral) instead of the flat primary badge used everywhere today.
- Seeded test accounts (from `backend/src/seed/data.json`, available once `docker compose up --build` seeds the empty database): gestor login is `carlos.gestor@prefeitura.gov` / `gestor123` (tipo "Gestor"); citizen login is `gustavohgordiano@gmail.com` / `gustavo21hl` (tipo "Cidadão").

---

### Task 1: Route scaffold for `/gestor`

**Files:**
- Create: `frontend/src/pages/GestaoObras.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `frontend/src/context/AuthContext.tsx` (returns `{ usuario, carregando, login, logout, refetch }`, `usuario: Usuario | null` where `Usuario.gestor: boolean`).
- Produces: default export `GestaoObras` (a `Main.tsx`-style page component), mounted at route `/gestor`. No other task depends on internals yet beyond the route existing.

- [ ] **Step 1: Create the page shell**

Write `frontend/src/pages/GestaoObras.tsx`:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GestaoObras() {
  const { usuario, carregando, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (carregando) return;
    if (!usuario) navigate("/login");
  }, [carregando, usuario, navigate]);

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

      <main className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-neutral-700">Painel de gestão em construção.</p>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

In `frontend/src/App.tsx`, add the import next to the other page imports:

```tsx
import EditorObras from "./pages/EditorObras";
import GestaoObras from "./pages/GestaoObras";
```

And add the route next to the `/editor` route (keep `/editor` for now — it is removed in Task 6):

```tsx
          <Route path="/editor" element={<EditorObras />} />
          <Route path="/gestor" element={<GestaoObras />} />
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

Run: `cd frontend && npm run lint`
Expected: no new lint errors.

- [ ] **Step 4: Manual verification**

Run: `docker compose up --build` from the repo root, then open `http://localhost:5173`.

1. Log in as `carlos.gestor@prefeitura.gov` / `gestor123` (tipo Gestor), then navigate directly to `http://localhost:5173/gestor`. Expected: the green header "Obra Prima — Gestão" with "Painel de gestão em construção." renders.
2. Log out, log in as `gustavohgordiano@gmail.com` / `gustavo21hl` (tipo Cidadão), navigate to `/gestor`. Expected: "Acesso restrito a gestores." message.
3. Log out fully, navigate to `/gestor`. Expected: redirected to `/login`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/GestaoObras.tsx frontend/src/App.tsx
git commit -m "feat(frontend): adiciona rota /gestor com shell da pagina de gestao"
```

---

### Task 2: Left panel — obra list, search, filters, selection

**Files:**
- Create: `frontend/src/components/gestor/ObraListaGestao.tsx`
- Modify: `frontend/src/pages/GestaoObras.tsx`

**Interfaces:**
- Consumes: `Obra` type from `frontend/src/api/types.ts`; `listarObras()` from `frontend/src/api/obras.ts` (returns `Promise<Obra[]>`).
- Produces: `ObraListaGestao` default export with props `{ obras: Obra[]; statusDisponiveis: string[]; cidadesDisponiveis: string[]; selecionadaId: string | null; busca: string; onBuscaChange: (v: string) => void; filtroStatus: string; onFiltroStatusChange: (v: string) => void; filtroCidade: string; onFiltroCidadeChange: (v: string) => void; ordenarPor: "titulo" | "dataInicio"; onOrdenarPorChange: (v: "titulo" | "dataInicio") => void; onSelecionar: (id: string) => void; onNovaObra: () => void }`. `GestaoObras.tsx` now owns a `selecaoId: string | "novo" | null` state that Task 3 will consume.

- [ ] **Step 1: Create the list component**

Write `frontend/src/components/gestor/ObraListaGestao.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire it into the page**

Replace the full contents of `frontend/src/pages/GestaoObras.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarObras } from "../api/obras";
import type { Obra } from "../api/types";
import ObraListaGestao from "../components/gestor/ObraListaGestao";

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

        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center text-neutral-600 shadow-sm">
          {modo === "vazio" && "Selecione uma obra na lista ao lado ou cadastre uma nova."}
          {modo === "novo" && "Modo de criação selecionado (formulário chega na próxima etapa)."}
          {modo === "edicao" && `Obra selecionada: ${obraSelecionada?.titulo ?? selecaoId}`}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

Run: `cd frontend && npm run lint`
Expected: no new lint errors.

- [ ] **Step 4: Manual verification**

With `docker compose up --build` running, log in as the gestor and open `/gestor`:

1. The obra list renders on the left with status badges, city, value, progress bar, feedback count.
2. Type in the search box — list narrows to matching titles/companies/cities.
3. Pick a status and a city filter — list narrows accordingly; clear both — list returns to full.
4. Switch "Ordenar por" between título/data de início — order changes.
5. Click an obra row — it gets a highlighted border/ring, and the right panel placeholder shows "Obra selecionada: <título>".
6. Click "+ Nova obra" — right panel placeholder shows the creation-mode message.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/gestor/ObraListaGestao.tsx frontend/src/pages/GestaoObras.tsx
git commit -m "feat(frontend): adiciona lista de obras com busca e filtros ao painel do gestor"
```

---

### Task 3: Right panel — create/edit form with marcos, wired to save/delete

**Files:**
- Create: `frontend/src/components/gestor/ObraFormularioTab.tsx`
- Create: `frontend/src/components/gestor/ObraPainelGestao.tsx`
- Modify: `frontend/src/pages/GestaoObras.tsx`

**Interfaces:**
- Consumes: `Obra`, `Marco` types from `frontend/src/api/types.ts`; `criarObra`, `atualizarObra`, `excluirObra` from `frontend/src/api/obras.ts`.
- Produces: `ObraFormularioTab` default export with props `{ obra: Obra | null; salvando: boolean; erroSalvar: string | null; onSalvar: (payload: Partial<Obra>) => void; onExcluir?: () => void }`. `ObraPainelGestao` default export with props `{ obra: Obra | null; modo: "vazio" | "novo" | "edicao"; salvando: boolean; erroSalvar: string | null; onSalvar: (payload: Partial<Obra>) => void; onExcluir: () => void; onNovaObra: () => void }` — Task 4 extends `ObraPainelGestao` with tabs but keeps this prop signature unchanged.

- [ ] **Step 1: Create the form/marcos tab component**

Write `frontend/src/components/gestor/ObraFormularioTab.tsx`:

```tsx
import { useState } from "react";
import type { Marco, Obra } from "../../api/types";

interface Props {
  obra: Obra | null;
  salvando: boolean;
  erroSalvar: string | null;
  onSalvar: (payload: Partial<Obra>) => void;
  onExcluir?: () => void;
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

export default function ObraFormularioTab({ obra, salvando, erroSalvar, onSalvar, onExcluir }: Props) {
  const [form, setForm] = useState<FormObra>(() => obraParaForm(obra));
  const [marcos, setMarcos] = useState<Marco[]>(() => (obra?.marcos ? [...obra.marcos] : []));
  const [marcoForm, setMarcoForm] = useState(MARCO_VAZIO);
  const [marcoEditIndex, setMarcoEditIndex] = useState<number | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

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
```

- [ ] **Step 2: Create the detail panel shell**

Write `frontend/src/components/gestor/ObraPainelGestao.tsx`:

```tsx
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
```

- [ ] **Step 3: Wire save/delete into the page**

In `frontend/src/pages/GestaoObras.tsx`:

Add these imports:

```tsx
import { atualizarObra, criarObra, excluirObra, listarObras } from "../api/obras";
import ObraPainelGestao from "../components/gestor/ObraPainelGestao";
```

(replace the existing `import { listarObras } from "../api/obras";` line with the combined import above)

Add state right after the `ordenarPor` state:

```tsx
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
```

Add handlers right after the `obraSelecionada` computation:

```tsx
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
```

Replace the placeholder `<div className="flex flex-1 flex-col items-center justify-center ...">...</div>` block inside `<main>` with:

```tsx
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
```

- [ ] **Step 4: Typecheck and lint**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

Run: `cd frontend && npm run lint`
Expected: no new lint errors.

- [ ] **Step 5: Manual verification**

With `docker compose up --build` running, log in as the gestor and open `/gestor`:

1. Click "+ Nova obra", fill título + a couple of fields, add a marco, click "Salvar". Expected: no error, the new obra appears in the left list, and the right panel now shows it in edit mode (title in the header changes from "Cadastrar Obra" to the obra's título).
2. Edit the title of an existing obra and click "Salvar" again. Expected: the list row updates to the new title.
3. Add, edit, and remove a marco on an existing obra, save. Expected: progress bar and marco list reflect the changes after reload of that obra.
4. Try saving with an empty título. Expected: inline error "Título é obrigatório." and no request is sent (list doesn't change).
5. Click "Excluir obra" on an obra, confirm the browser dialog. Expected: the obra disappears from the list and the right panel returns to the empty state.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/gestor/ObraFormularioTab.tsx frontend/src/components/gestor/ObraPainelGestao.tsx frontend/src/pages/GestaoObras.tsx
git commit -m "feat(frontend): adiciona criacao edicao e exclusao de obras ao painel do gestor"
```

---

### Task 4: Read-only tabs — Linha do tempo and Feedbacks

**Files:**
- Create: `frontend/src/components/gestor/ObraLinhaDoTempoTab.tsx`
- Create: `frontend/src/components/gestor/ObraFeedbacksTab.tsx`
- Modify: `frontend/src/components/gestor/ObraPainelGestao.tsx`

**Interfaces:**
- Consumes: `Obra` type from `frontend/src/api/types.ts`.
- Produces: `ObraLinhaDoTempoTab` default export with props `{ obra: Obra | null }`; `ObraFeedbacksTab` default export with props `{ obra: Obra | null }`. `ObraPainelGestao`'s own props are unchanged from Task 3 — this task only changes what it renders internally.

- [ ] **Step 1: Create the read-only timeline tab**

Write `frontend/src/components/gestor/ObraLinhaDoTempoTab.tsx`:

```tsx
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
```

- [ ] **Step 2: Create the read-only feedbacks tab**

Write `frontend/src/components/gestor/ObraFeedbacksTab.tsx`:

```tsx
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
```

- [ ] **Step 3: Add the tab bar to the detail panel**

Replace the full contents of `frontend/src/components/gestor/ObraPainelGestao.tsx` with:

```tsx
import { useState } from "react";
import type { Obra } from "../../api/types";
import ObraFormularioTab from "./ObraFormularioTab";
import ObraLinhaDoTempoTab from "./ObraLinhaDoTempoTab";
import ObraFeedbacksTab from "./ObraFeedbacksTab";

interface Props {
  obra: Obra | null;
  modo: "vazio" | "novo" | "edicao";
  salvando: boolean;
  erroSalvar: string | null;
  onSalvar: (payload: Partial<Obra>) => void;
  onExcluir: () => void;
  onNovaObra: () => void;
}

type Aba = "editar" | "linha-do-tempo" | "feedbacks";

const ABAS: [Aba, string][] = [
  ["editar", "Editar"],
  ["linha-do-tempo", "Linha do tempo"],
  ["feedbacks", "Feedbacks"],
];

export default function ObraPainelGestao({ obra, modo, salvando, erroSalvar, onSalvar, onExcluir, onNovaObra }: Props) {
  const [aba, setAba] = useState<Aba>("editar");

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

      <div className="mb-4 flex gap-2 border-b border-surface-border">
        {ABAS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setAba(value)}
            className={`px-3 py-2 text-sm font-semibold transition ${
              aba === value ? "border-b-2 border-primary text-primary" : "text-neutral-600 hover:text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "editar" && (
        <ObraFormularioTab
          key={obra?._id ?? "novo"}
          obra={obra}
          salvando={salvando}
          erroSalvar={erroSalvar}
          onSalvar={onSalvar}
          onExcluir={modo === "edicao" ? onExcluir : undefined}
        />
      )}
      {aba === "linha-do-tempo" && <ObraLinhaDoTempoTab obra={obra} />}
      {aba === "feedbacks" && <ObraFeedbacksTab obra={obra} />}
    </div>
  );
}
```

Note: `ObraPainelGestao` is already rendered with `key={selecaoId ?? "vazio"}` in `GestaoObras.tsx` from Task 3, so switching the selected obra remounts this component and resets `aba` back to `"editar"` — no stale-tab state when hopping between obras.

- [ ] **Step 4: Typecheck and lint**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

Run: `cd frontend && npm run lint`
Expected: no new lint errors.

- [ ] **Step 5: Manual verification**

With `docker compose up --build` running, log in as the gestor and open `/gestor`:

1. Select an obra that has seeded feedbacks (check `backend/src/seed/data.json` for one with a non-empty `feedbacks` array, or add one via the citizen flow first: log in as `gustavohgordiano@gmail.com` and submit a feedback on an obra from `/main`). Click the "Feedbacks" tab. Expected: the feedback(s) render with tipo, título, descrição, autor, data.
2. Click "Linha do tempo" tab on an obra with marcos. Expected: same read-only progress bar and marco list as the citizen's `ObraDetalhesPanel` shows today.
3. Select an obra with no feedbacks. Expected: "Feedbacks" tab shows "Nenhum feedback registrado."
4. Click "+ Nova obra". Expected: tab bar resets to "Editar" with an empty form; clicking "Feedbacks" or "Linha do tempo" shows the "Salve a obra..." placeholder message.
5. Switch between two different existing obras. Expected: the active tab resets to "Editar" each time (per the remount note above).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/gestor/ObraLinhaDoTempoTab.tsx frontend/src/components/gestor/ObraFeedbacksTab.tsx frontend/src/components/gestor/ObraPainelGestao.tsx
git commit -m "feat(frontend): adiciona abas de linha do tempo e feedbacks ao painel do gestor"
```

---

### Task 5: Stats bar

**Files:**
- Modify: `frontend/src/pages/GestaoObras.tsx`

**Interfaces:**
- Consumes: the existing `obras: Obra[]` state already in `GestaoObras.tsx`.
- Produces: no new exports; purely additive UI.

- [ ] **Step 1: Add the stats computation**

In `frontend/src/pages/GestaoObras.tsx`, add this `useMemo` right after the `obrasFiltradas` useMemo block:

```tsx
  const stats = useMemo(() => {
    const total = obras.length;
    const andamento = obras.filter((o) => o.status === "Em andamento").length;
    const concluidas = obras.filter((o) => o.status === "Concluída").length;
    const feedbacks = obras.reduce((acc, o) => acc + (o.feedbacks?.length ?? 0), 0);
    return { total, andamento, concluidas, feedbacks };
  }, [obras]);
```

- [ ] **Step 2: Render the stats bar**

Insert this `<section>` between the closing `</header>` tag and the `{erroCarregar && ...}` line:

```tsx
      <section className="grid grid-cols-2 gap-3 px-5 pt-5 sm:grid-cols-4">
        {[
          { label: "Total de obras", valor: stats.total },
          { label: "Em andamento", valor: stats.andamento },
          { label: "Concluídas", valor: stats.concluidas },
          { label: "Feedbacks recebidos", valor: stats.feedbacks },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-surface-border bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">{item.valor}</p>
            <p className="text-sm text-neutral-600">{item.label}</p>
          </div>
        ))}
      </section>
```

- [ ] **Step 3: Typecheck and lint**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

Run: `cd frontend && npm run lint`
Expected: no new lint errors.

- [ ] **Step 4: Manual verification**

With `docker compose up --build` running, log in as the gestor and open `/gestor`. Expected: four stat cards render below the header (Total de obras, Em andamento, Concluídas, Feedbacks recebidos) with correct counts matching what's visible in the list. Create a new obra with status "Em andamento" and save — the "Total de obras" and "Em andamento" counts increment by 1 without a page reload.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/GestaoObras.tsx
git commit -m "feat(frontend): adiciona barra de estatisticas ao painel do gestor"
```

---

### Task 6: Cutover — remove `/editor`, point `/main` at `/gestor`

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/Main.tsx`
- Delete: `frontend/src/pages/EditorObras.tsx`

**Interfaces:**
- Consumes: `GestaoObras` from `frontend/src/pages/GestaoObras.tsx` (already built in Tasks 1–5).
- Produces: n/a — this is the final integration task.

- [ ] **Step 1: Remove the `/editor` route**

In `frontend/src/App.tsx`, remove the `EditorObras` import line:

```tsx
import EditorObras from "./pages/EditorObras";
```

and remove the `/editor` route line:

```tsx
          <Route path="/editor" element={<EditorObras />} />
```

The file should end up with these imports:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CadastroCidadao from "./pages/CadastroCidadao";
import CadastroGestor from "./pages/CadastroGestor";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";
import Main from "./pages/Main";
import GestaoObras from "./pages/GestaoObras";
```

and these routes:

```tsx
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro/cidadao" element={<CadastroCidadao />} />
          <Route path="/cadastro/gestor" element={<CadastroGestor />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/obras/:id" element={<ObraDetalhe />} />
          <Route path="/main" element={<Main />} />
          <Route path="/gestor" element={<GestaoObras />} />
        </Routes>
```

- [ ] **Step 2: Point the "Painel do Gestor" button at `/gestor`**

In `frontend/src/pages/Main.tsx`, find:

```tsx
        {usuario.gestor && (
          <button
            onClick={() => navigate("/editor")}
            className="rounded-lg bg-blue-500 px-3 py-1.5 font-bold text-white"
          >
            Painel do Gestor
          </button>
        )}
```

and change `navigate("/editor")` to `navigate("/gestor")`.

- [ ] **Step 3: Delete the old editor page**

```bash
rm frontend/src/pages/EditorObras.tsx
```

- [ ] **Step 4: Typecheck and lint**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors (confirms no remaining references to `EditorObras` or `/editor`).

Run: `cd frontend && npm run lint`
Expected: no new lint errors.

Run: `grep -rn "EditorObras\|/editor" frontend/src`
Expected: no matches.

- [ ] **Step 5: Full manual verification (spec checklist)**

With `docker compose up --build` running:

1. Log in as gestor (`carlos.gestor@prefeitura.gov` / `gestor123`) → lands on `/main` → click "Painel do Gestor" → navigates to `/gestor` and the list + stats load.
2. Create a new obra via "+ Nova obra", including marcos, and save.
3. Select an existing obra, edit its data and marcos, save.
4. Confirm the "Linha do tempo" tab reflects the saved marcos.
5. Confirm the "Feedbacks" tab shows existing feedbacks for an obra that has them.
6. Delete an obra and confirm it's removed from the list.
7. Log out, log in as the citizen (`gustavohgordiano@gmail.com` / `gustavo21hl`), navigate directly to `/gestor` → see "Acesso restrito a gestores."
8. As the citizen, confirm `/main` and the `ObraDetalhesPanel` (click "Ver detalhes" on an obra) still work exactly as before — grid/list view toggle, filters, tabs, submitting a feedback.
9. Navigate to the old `/editor` URL directly → confirm it no longer matches any route (React Router renders nothing for unmatched paths in this app, since there is no catch-all route — this is pre-existing behavior, not a regression introduced here).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/Main.tsx
git rm frontend/src/pages/EditorObras.tsx
git commit -m "refactor(frontend): substitui /editor por /gestor como painel unico do gestor"
```

---

## Plan Self-Review Notes

- **Spec coverage:** Master-detail layout (Task 2+3), dense list with status/city/value/progress/feedback-count (Task 2), status badges by color (Task 2), "+ Nova obra" opening blank form in the same panel (Task 3), Editar/Linha do tempo/Feedbacks tabs (Task 4), stats bar (Task 5), `/main` entry point preserved and button retargeted (Task 6), `/editor` removed (Task 6), visual refinement (rounded-xl/2xl, shadow-sm, spacing) applied throughout Tasks 2–5 rather than deferred. All 9 spec verification items are covered across Task 6 Step 5 (plus earlier per-task checks).
- **Type consistency:** `selecaoId: string | "novo" | null` is defined once in `GestaoObras.tsx` (Task 2) and never redeclared; `modo: "vazio" | "novo" | "edicao"` is derived from it consistently in Tasks 2 and 3 and passed unchanged into `ObraPainelGestao` in Tasks 3–4. `Obra | null` is the consistent `obra` prop type across `ObraFormularioTab`, `ObraPainelGestao`, `ObraLinhaDoTempoTab`, `ObraFeedbacksTab`.
- **No placeholders:** every step has full runnable code, not descriptions.
