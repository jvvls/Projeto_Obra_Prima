# Refatoração Docker + React/TS/Tailwind + Node/TS + MongoDB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o stack atual (Express + json-server + vanilla JS, sem containers) por uma aplicação containerizada via Docker Compose, com frontend React+TypeScript+Tailwind, backend Node+TypeScript+Express+MongoDB, preservando a identidade visual e as funcionalidades atuais.

**Architecture:** Três serviços Docker Compose (`mongo`, `backend`, `frontend`) com hot-reload em dev. O backend expõe uma API REST (`/api/auth`, `/api/usuarios`, `/api/obras`) sobre MongoDB via Mongoose, com login por JWT em cookie httpOnly e senhas hasheadas com bcrypt. O frontend é uma SPA React Router consumindo essa API com `credentials: "include"`.

**Tech Stack:** Docker Compose; Node 20; Express 4; TypeScript; Mongoose 8; MongoDB 7; bcryptjs; jsonwebtoken; Vite; React 18; React Router; Tailwind CSS.

## Global Constraints

- Paleta de cores deve ser preservada: primária `#27ae60` (+ `#219150`/`#1e8b4a` hover, `#1b7742` dark, `#2ecc71` light accent), neutros `#333`/`#555`/`#666`/`#999`, fundos `#fff`/`#f7faf8`/`#f5f5f5`, borda `#e0e0e0`.
- O código-fonte atual em `codigo/public/` é a referência de comportamento para cada tela — sempre ler o arquivo legado correspondente antes de implementar a versão React.
- Sem testes automatizados (fora de escopo, conforme spec). Verificação é manual/funcional (curl, browser).
- Sem deploy de produção nesta refatoração — só ambiente local via `docker compose up`.
- Todas as chamadas de API do frontend usam `credentials: "include"`.
- Referência de design: `docs/superpowers/specs/2026-08-12-refatoracao-docker-react-mongo-design.md`.

---

## Task 1: Scaffold do backend (Express + TS + Mongoose, sem rotas ainda)

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/Dockerfile`
- Create: `backend/src/server.ts`
- Create: `backend/.dockerignore`

**Interfaces:**
- Produces: servidor Express escutando em `process.env.PORT` (default `4000`), conectado ao Mongo via `process.env.MONGO_URI`, com rota `GET /api/health` retornando `{ status: "ok" }`. CORS habilitado para `process.env.FRONTEND_ORIGIN` com `credentials: true`.

- [ ] **Step 1: Criar `backend/package.json`**

```json
{
  "name": "obraprima-backend",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.9",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3"
  }
}
```

- [ ] **Step 2: Criar `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Criar `backend/src/server.ts`**

```ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/obraprima";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

async function start() {
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
}

start();
```

- [ ] **Step 4: Criar `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
```

- [ ] **Step 5: Criar `backend/.dockerignore`**

```
node_modules
dist
```

- [ ] **Step 6: Instalar dependências e verificar build local**

Run: `cd backend && npm install && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 7: Subir um Mongo local avulso e testar o servidor**

Run: `docker run --rm -d --name mongo-test -p 27017:27017 mongo:7 && cd backend && MONGO_URI=mongodb://localhost:27017/obraprima npm run dev`
Em outro terminal: `curl -s http://localhost:4000/api/health`
Expected: `{"status":"ok"}`. Depois: `Ctrl+C` no servidor e `docker stop mongo-test`.

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/Dockerfile backend/.dockerignore backend/src/server.ts
git commit -m "feat(backend): cria scaffold do servidor express+ts com conexao mongo"
```

---

## Task 2: Modelos Mongoose (Usuario, Obra)

**Files:**
- Create: `backend/src/models/Usuario.ts`
- Create: `backend/src/models/Obra.ts`

**Interfaces:**
- Consumes: nada de tarefas anteriores além do `mongoose` já instalado (Task 1).
- Produces:
  - `Usuario` (default export do model), interface `IUsuario` com campos `gestor: boolean`, `dadosPessoais: { nomeCompleto, cpf, dataNascimento?, genero? }`, `contato: { email, telefone? }`, `endereco?: {...}`, `seguranca: { passwordHash: string }`, `dadosProfissionais?: {...}`, `aceitouTermos?: boolean`, `receberNotificacoes?: boolean`.
  - `Obra` (default export do model), interfaces `IMarco`, `IFeedback`, `IAnexo`, `IObra` com campos `titulo, descricao, valorContratado, status, dataInicio, previsaoTermino, orgaoResponsavel, empresaExecutora, latitude?, longitude?, endereco, anexos: IAnexo[], marcos: IMarco[], feedbacks: IFeedback[]`.

- [ ] **Step 1: Criar `backend/src/models/Usuario.ts`**

```ts
import { Schema, model, Types } from "mongoose";

export interface IUsuario {
  _id: Types.ObjectId;
  gestor: boolean;
  dadosPessoais: {
    nomeCompleto: string;
    cpf: string;
    dataNascimento?: string;
    genero?: string;
  };
  contato: {
    email: string;
    telefone?: string;
  };
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  seguranca: {
    passwordHash: string;
  };
  dadosProfissionais?: {
    orgaoInstituicao?: string;
    cargo?: string;
    experiencia?: string;
    areaAtuacao?: string;
  };
  aceitouTermos?: boolean;
  receberNotificacoes?: boolean;
}

const usuarioSchema = new Schema<IUsuario>(
  {
    gestor: { type: Boolean, required: true, default: false },
    dadosPessoais: {
      nomeCompleto: { type: String, required: true },
      cpf: { type: String, required: true },
      dataNascimento: String,
      genero: String,
    },
    contato: {
      email: { type: String, required: true, unique: true },
      telefone: String,
    },
    endereco: {
      cep: String,
      logradouro: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      estado: String,
    },
    seguranca: {
      passwordHash: { type: String, required: true },
    },
    dadosProfissionais: {
      orgaoInstituicao: String,
      cargo: String,
      experiencia: String,
      areaAtuacao: String,
    },
    aceitouTermos: Boolean,
    receberNotificacoes: Boolean,
  },
  { timestamps: { createdAt: "criadoEm", updatedAt: false } }
);

export const Usuario = model<IUsuario>("Usuario", usuarioSchema);
```

- [ ] **Step 2: Criar `backend/src/models/Obra.ts`**

```ts
import { Schema, model, Types } from "mongoose";

export interface IMarco {
  titulo: string;
  descricao: string;
  percentual: number;
  data: string;
}

export interface IFeedback {
  nome: string;
  cpf?: string;
  email?: string;
  tipo: "elogio" | "reclamacao" | "sugestao";
  titulo: string;
  descricao: string;
  dataEnvio: string;
  anexo?: string;
}

export interface IAnexo {
  tipo: string;
  nomeArquivo: string;
  url?: string | null;
}

export interface IObra {
  _id: Types.ObjectId;
  titulo: string;
  descricao: string;
  valorContratado: number;
  status: string;
  dataInicio: string;
  previsaoTermino: string;
  orgaoResponsavel: string;
  empresaExecutora: string;
  latitude?: number;
  longitude?: number;
  endereco: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  anexos: IAnexo[];
  marcos: IMarco[];
  feedbacks: IFeedback[];
}

const obraSchema = new Schema<IObra>({
  titulo: { type: String, required: true },
  descricao: String,
  valorContratado: Number,
  status: { type: String, required: true },
  dataInicio: String,
  previsaoTermino: String,
  orgaoResponsavel: String,
  empresaExecutora: String,
  latitude: Number,
  longitude: Number,
  endereco: {
    logradouro: String,
    numero: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String,
  },
  anexos: [{ tipo: String, nomeArquivo: String, url: Schema.Types.Mixed }],
  marcos: [{ titulo: String, descricao: String, percentual: Number, data: String }],
  feedbacks: [
    {
      nome: String,
      cpf: String,
      email: String,
      tipo: { type: String, enum: ["elogio", "reclamacao", "sugestao"] },
      titulo: String,
      descricao: String,
      dataEnvio: String,
      anexo: String,
    },
  ],
});

export const Obra = model<IObra>("Obra", obraSchema);
```

- [ ] **Step 3: Verificar compilação**

Run: `cd backend && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add backend/src/models
git commit -m "feat(backend): adiciona modelos mongoose de usuario e obra"
```

---

## Task 3: Autenticação (JWT + cookie httpOnly + bcrypt)

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/routes/auth.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `Usuario` model (Task 2).
- Produces:
  - `verifyAuth(req, res, next)` middleware que popula `req.auth = { sub: string; gestor: boolean }` a partir do cookie `token`, ou responde 401.
  - `requireGestor(req, res, next)` middleware que responde 403 se `req.auth.gestor !== true`.
  - Router em `backend/src/routes/auth.ts` (default export) montado em `/api/auth`: `POST /login`, `POST /logout`, `GET /me`.

- [ ] **Step 1: Criar `backend/src/middleware/auth.ts`**

```ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthPayload {
  sub: string;
  gestor: boolean;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Não autenticado" });
  try {
    req.auth = jwt.verify(token, JWT_SECRET) as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida" });
  }
}

export function requireGestor(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.gestor) return res.status(403).json({ error: "Acesso restrito a gestores" });
  next();
}
```

- [ ] **Step 2: Criar `backend/src/routes/auth.ts`**

```ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario } from "../models/Usuario";
import { verifyAuth } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const isProd = process.env.NODE_ENV === "production";

function toPublicUsuario(usuario: InstanceType<typeof Usuario>) {
  const { seguranca, ...rest } = usuario.toObject();
  return rest;
}

router.post("/login", async (req, res) => {
  const { email, senha, tipo } = req.body ?? {};
  if (!email || !senha || !tipo) {
    return res.status(400).json({ error: "email, senha e tipo são obrigatórios" });
  }

  const usuario = await Usuario.findOne({ "contato.email": email, gestor: tipo === "gestor" });
  if (!usuario) return res.status(401).json({ error: "Email ou senha incorretos" });

  const senhaValida = await bcrypt.compare(senha, usuario.seguranca.passwordHash);
  if (!senhaValida) return res.status(401).json({ error: "Email ou senha incorretos" });

  const token = jwt.sign({ sub: usuario._id.toString(), gestor: usuario.gestor }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json(toPublicUsuario(usuario));
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.status(204).send();
});

router.get("/me", verifyAuth, async (req, res) => {
  const usuario = await Usuario.findById(req.auth!.sub);
  if (!usuario) return res.status(401).json({ error: "Não autenticado" });
  res.json(toPublicUsuario(usuario));
});

export default router;
```

- [ ] **Step 3: Montar o router em `backend/src/server.ts`**

Adicionar após `app.use(cookieParser());`:

```ts
import authRoutes from "./routes/auth";
// ...
app.use("/api/auth", authRoutes);
```

- [ ] **Step 4: Verificar compilação**

Run: `cd backend && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 5: Teste manual end-to-end com um usuário criado via shell do Mongo**

Run:
```bash
docker run --rm -d --name mongo-test -p 27017:27017 mongo:7
node -e "
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('senha123', 10));
" # copie o hash impresso
docker exec -it mongo-test mongosh obraprima --eval '
db.usuarios.insertOne({
  gestor: false,
  dadosPessoais: { nomeCompleto: "Teste", cpf: "000" },
  contato: { email: "teste@teste.com" },
  seguranca: { passwordHash: "<COLE_O_HASH_AQUI>" }
})'
cd backend && MONGO_URI=mongodb://localhost:27017/obraprima npm run dev
```
Em outro terminal:
```bash
curl -i -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","senha":"senha123","tipo":"cidadao"}'
curl -i -b cookies.txt http://localhost:4000/api/auth/me
```
Expected: login retorna 200 com o usuário (sem `seguranca`) e `Set-Cookie: token=...`; `/me` retorna 200 com o mesmo usuário. Depois: `Ctrl+C`, `docker stop mongo-test`, `rm cookies.txt`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/middleware backend/src/routes/auth.ts backend/src/server.ts
git commit -m "feat(backend): adiciona autenticacao por jwt em cookie httponly"
```

---

## Task 4: Rotas de usuários (cadastro, consulta, atualização)

**Files:**
- Create: `backend/src/routes/usuarios.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `Usuario` model (Task 2), `verifyAuth` (Task 3).
- Produces: router (default export) montado em `/api/usuarios`: `POST /` (cadastro), `GET /:id` (autenticado, só o próprio), `PATCH /:id` (autenticado, só o próprio).

- [ ] **Step 1: Criar `backend/src/routes/usuarios.ts`**

```ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import { Usuario } from "../models/Usuario";
import { verifyAuth } from "../middleware/auth";

const router = Router();

router.post("/", async (req, res) => {
  const { seguranca, ...rest } = req.body ?? {};
  if (!seguranca?.password) return res.status(400).json({ error: "senha é obrigatória" });

  const existente = await Usuario.findOne({ "contato.email": rest?.contato?.email });
  if (existente) return res.status(409).json({ error: "Email já cadastrado" });

  const passwordHash = await bcrypt.hash(seguranca.password, 10);
  const usuario = await Usuario.create({ ...rest, seguranca: { passwordHash } });

  const { seguranca: _s, ...publico } = usuario.toObject();
  res.status(201).json(publico);
});

router.get("/:id", verifyAuth, async (req, res) => {
  if (req.auth!.sub !== req.params.id) return res.status(403).json({ error: "Acesso negado" });
  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });
  const { seguranca, ...publico } = usuario.toObject();
  res.json(publico);
});

router.patch("/:id", verifyAuth, async (req, res) => {
  if (req.auth!.sub !== req.params.id) return res.status(403).json({ error: "Acesso negado" });
  const { seguranca, ...updates } = req.body ?? {};
  const usuario = await Usuario.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });
  const { seguranca: _s, ...publico } = usuario.toObject();
  res.json(publico);
});

export default router;
```

- [ ] **Step 2: Montar o router em `backend/src/server.ts`**

```ts
import usuariosRoutes from "./routes/usuarios";
// ...
app.use("/api/usuarios", usuariosRoutes);
```

- [ ] **Step 3: Verificar compilação**

Run: `cd backend && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 4: Teste manual de cadastro**

Run (com `mongo-test` rodando e o backend em `npm run dev`, como no Task 3):
```bash
curl -i -X POST http://localhost:4000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"gestor":false,"dadosPessoais":{"nomeCompleto":"Ana","cpf":"111"},"contato":{"email":"ana@teste.com"},"seguranca":{"password":"abc12345"}}'
```
Expected: 201 com o usuário criado, sem o campo `seguranca` na resposta.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/usuarios.ts backend/src/server.ts
git commit -m "feat(backend): adiciona rotas de cadastro e consulta de usuarios"
```

---

## Task 5: Rotas de obras (CRUD + feedbacks)

**Files:**
- Create: `backend/src/routes/obras.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `Obra` model (Task 2), `verifyAuth`/`requireGestor` (Task 3).
- Produces: router (default export) montado em `/api/obras`: `GET /`, `GET /:id`, `POST /` (gestor), `PUT /:id` (gestor, substituição completa), `DELETE /:id` (gestor), `POST /:id/feedbacks` (público, acrescenta um feedback).

- [ ] **Step 1: Criar `backend/src/routes/obras.ts`**

```ts
import { Router } from "express";
import { Obra } from "../models/Obra";
import { verifyAuth, requireGestor } from "../middleware/auth";

const router = Router();

router.get("/", async (_req, res) => {
  const obras = await Obra.find();
  res.json(obras);
});

router.get("/:id", async (req, res) => {
  const obra = await Obra.findById(req.params.id);
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.json(obra);
});

router.post("/", verifyAuth, requireGestor, async (req, res) => {
  const obra = await Obra.create(req.body ?? {});
  res.status(201).json(obra);
});

router.put("/:id", verifyAuth, requireGestor, async (req, res) => {
  const obra = await Obra.findByIdAndUpdate(req.params.id, req.body ?? {}, {
    new: true,
    overwrite: true,
  });
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.json(obra);
});

router.delete("/:id", verifyAuth, requireGestor, async (req, res) => {
  const obra = await Obra.findByIdAndDelete(req.params.id);
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.status(204).send();
});

router.post("/:id/feedbacks", async (req, res) => {
  const { nome, cpf, email, tipo, titulo, descricao, anexo } = req.body ?? {};
  if (!nome || !tipo || !titulo || !descricao) {
    return res.status(400).json({ error: "nome, tipo, titulo e descricao são obrigatórios" });
  }
  const obra = await Obra.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        feedbacks: { nome, cpf, email, tipo, titulo, descricao, anexo, dataEnvio: new Date().toISOString() },
      },
    },
    { new: true }
  );
  if (!obra) return res.status(404).json({ error: "Obra não encontrada" });
  res.status(201).json(obra);
});

export default router;
```

- [ ] **Step 2: Montar o router em `backend/src/server.ts`**

```ts
import obrasRoutes from "./routes/obras";
// ...
app.use("/api/obras", obrasRoutes);
```

- [ ] **Step 3: Verificar compilação**

Run: `cd backend && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 4: Teste manual (com `mongo-test` e backend rodando)**

```bash
curl -i -b cookies.txt -X POST http://localhost:4000/api/obras \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Obra Teste","status":"Em andamento","endereco":{},"anexos":[],"marcos":[],"feedbacks":[]}'
curl -s http://localhost:4000/api/obras | head -c 200
```
(reaproveite o `cookies.txt` de um login como gestor no Task 3, adaptando o usuário de teste para `gestor: true`)
Expected: `POST` retorna 201 com a obra criada (contendo `_id`); `GET /` lista incluindo essa obra.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/obras.ts backend/src/server.ts
git commit -m "feat(backend): adiciona crud de obras e endpoint de feedbacks"
```

---

## Task 6: Seed automático a partir dos dados atuais

**Files:**
- Create: `backend/src/seed/data.json` (cópia de `codigo/db/db.json`)
- Create: `backend/src/seed/index.ts`
- Modify: `backend/src/server.ts`
- Modify: `backend/tsconfig.json` (já tem `resolveJsonModule: true` desde o Task 1 — conferir)

**Interfaces:**
- Consumes: `Usuario`, `Obra` models (Task 2).
- Produces: `seedIfEmpty(): Promise<void>` (export nomeado) chamada no startup do servidor antes de `app.listen`.

- [ ] **Step 1: Copiar os dados atuais para o backend**

Run: `cp codigo/db/db.json backend/src/seed/data.json`

- [ ] **Step 2: Criar `backend/src/seed/index.ts`**

```ts
import bcrypt from "bcryptjs";
import { Usuario } from "../models/Usuario";
import { Obra } from "../models/Obra";
import data from "./data.json";

export async function seedIfEmpty() {
  const [usuariosCount, obrasCount] = await Promise.all([
    Usuario.countDocuments(),
    Obra.countDocuments(),
  ]);

  if (usuariosCount === 0 && Array.isArray((data as any).usuarios)) {
    const usuarios = await Promise.all(
      (data as any).usuarios.map(async (u: any) => {
        const { seguranca, id, ...rest } = u;
        const passwordHash = await bcrypt.hash(seguranca.password, 10);
        return { ...rest, seguranca: { passwordHash } };
      })
    );
    await Usuario.insertMany(usuarios);
    console.log(`Seed: ${usuarios.length} usuários inseridos`);
  }

  if (obrasCount === 0 && Array.isArray((data as any).obras)) {
    const obras = (data as any).obras.map((o: any) => {
      const { id, ...rest } = o;
      return rest;
    });
    await Obra.insertMany(obras);
    console.log(`Seed: ${obras.length} obras inseridas`);
  }
}
```

- [ ] **Step 3: Chamar o seed no startup, em `backend/src/server.ts`**

```ts
import { seedIfEmpty } from "./seed";
// ...
async function start() {
  await mongoose.connect(MONGO_URI);
  await seedIfEmpty();
  app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
}
```

- [ ] **Step 4: Verificar compilação**

Run: `cd backend && npx tsc --noEmit`
Expected: sem erros de tipo (confirme que `resolveJsonModule: true` está em `backend/tsconfig.json`).

- [ ] **Step 5: Teste manual com banco vazio**

```bash
docker run --rm -d --name mongo-test -p 27017:27017 mongo:7
cd backend && MONGO_URI=mongodb://localhost:27017/obraprima npm run dev
```
Expected no log: `Seed: 7 usuários inseridos` e `Seed: 15 obras inseridas` (contagens de `codigo/db/db.json`).
Run em outro terminal: `curl -s http://localhost:4000/api/obras | node -e "process.stdin.once('data', d => console.log(JSON.parse(d).length))"`
Expected: `15`.
Depois: `Ctrl+C`, `docker stop mongo-test`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/seed backend/src/server.ts
git commit -m "feat(backend): adiciona seed automatico a partir dos dados atuais"
```

---

## Task 7: Docker Compose (mongo + backend)

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example` (na raiz)

**Interfaces:**
- Consumes: `backend/Dockerfile` (Task 1).
- Produces: serviços `mongo` e `backend` funcionais via `docker compose up`. Serviço `frontend` será adicionado no Task 9.

- [ ] **Step 1: Criar `docker-compose.yml`**

```yaml
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      MONGO_URI: mongodb://mongo:27017/obraprima
      JWT_SECRET: dev-secret-change-me
      PORT: "4000"
      FRONTEND_ORIGIN: http://localhost:5173
      NODE_ENV: development
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "4000:4000"
    depends_on:
      - mongo

volumes:
  mongo_data:
```

- [ ] **Step 2: Criar `.env.example` na raiz**

```
# Copie para .env se quiser sobrescrever os defaults do docker-compose.yml
JWT_SECRET=dev-secret-change-me
```

- [ ] **Step 3: Subir e validar**

Run: `docker compose up --build -d mongo backend && sleep 5 && curl -s http://localhost:4000/api/health`
Expected: `{"status":"ok"}`.
Run: `docker compose logs backend | grep Seed`
Expected: linhas de seed de usuários e obras.
Depois: `docker compose down`

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat(infra): adiciona docker compose com mongo e backend"
```

---

## Task 8: Scaffold do frontend (Vite + React + TS + Tailwind, sem páginas ainda)

**Files:**
- Create: `frontend/` (via `npm create vite@latest`)
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/index.css`
- Create: `frontend/Dockerfile`
- Create: `frontend/.dockerignore`
- Create: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Produces: app React vazio rodando em `http://localhost:5173`, Tailwind configurado com a paleta (`primary`, `neutral`, `surface`), roteamento base pronto para receber páginas (Task 9 em diante) com rotas placeholder.

- [ ] **Step 1: Criar o projeto Vite**

Run: `npm create vite@latest frontend -- --template react-ts` (na raiz do repositório)

- [ ] **Step 2: Instalar Tailwind e React Router**

Run:
```bash
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npm install react-router-dom
npx tailwindcss init -p
```

- [ ] **Step 3: Configurar `frontend/tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#27ae60",
          hover: "#219150",
          dark: "#1e8b4a",
          darker: "#1b7742",
          light: "#2ecc71",
        },
        neutral: {
          900: "#333333",
          700: "#555555",
          600: "#666666",
          400: "#999999",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f7faf8",
          muted: "#f5f5f5",
          border: "#e0e0e0",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

(apague o `tailwind.config.js` gerado pelo `init`, se ele tiver criado um `.js` em vez de `.ts`.)

- [ ] **Step 4: Configurar `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-surface text-neutral-900;
}
```

- [ ] **Step 5: Criar `frontend/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function Placeholder({ nome }: { nome: string }) {
  return <div className="p-8 text-neutral-900">{nome}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder nome="Home" />} />
        <Route path="/login" element={<Placeholder nome="Login" />} />
        <Route path="/cadastro/cidadao" element={<Placeholder nome="Cadastro Cidadão" />} />
        <Route path="/cadastro/gestor" element={<Placeholder nome="Cadastro Gestor" />} />
        <Route path="/obras" element={<Placeholder nome="Obras" />} />
        <Route path="/obras/:id" element={<Placeholder nome="Obra Detalhe" />} />
        <Route path="/main" element={<Placeholder nome="Main" />} />
        <Route path="/editor" element={<Placeholder nome="Editor" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Garantir que `frontend/src/main.tsx` importe `index.css` e renderize `App`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Criar `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

- [ ] **Step 8: Criar `frontend/.dockerignore`**

```
node_modules
dist
```

- [ ] **Step 9: Verificar localmente**

Run: `cd frontend && npm run dev`
Abrir `http://localhost:5173/obras` no navegador.
Expected: página renderiza "Obras" com fundo branco (`bg-surface`) e texto escuro — confirma que o Tailwind está processando as classes customizadas. Depois: `Ctrl+C`.

- [ ] **Step 10: Commit**

```bash
git add frontend
git commit -m "feat(frontend): cria scaffold vite+react+ts+tailwind com rotas placeholder"
```

---

## Task 9: Cliente de API, tipos e contexto de sessão

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/types.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/api/usuarios.ts`
- Create: `frontend/src/api/obras.ts`
- Create: `frontend/src/context/AuthContext.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/.env.development`

**Interfaces:**
- Consumes: rotas do backend dos Tasks 3–5 (`/api/auth/*`, `/api/usuarios/*`, `/api/obras/*`).
- Produces:
  - `api` object em `client.ts` com `get/post/put/patch/delete<T>(path, body?): Promise<T>`, usando `credentials: "include"` e lançando `Error` com a mensagem do backend em caso de falha.
  - Tipos `Usuario`, `Obra`, `Marco`, `Feedback`, `Anexo` em `types.ts`, espelhando as interfaces do backend com `_id: string`.
  - `login(email, senha, tipo)`, `logout()`, `getMe()` em `auth.ts`.
  - `cadastrarUsuario(dados)`, `getUsuario(id)`, `atualizarUsuario(id, dados)` em `usuarios.ts`.
  - `listarObras()`, `getObra(id)`, `criarObra(dados)`, `atualizarObra(id, dados)`, `excluirObra(id)`, `enviarFeedback(obraId, dados)` em `obras.ts`.
  - `AuthProvider` + hook `useAuth()` retornando `{ usuario: Usuario | null; carregando: boolean; login; logout; refetch }`.

- [ ] **Step 1: Criar `frontend/.env.development`**

```
VITE_API_URL=http://localhost:4000/api
```

- [ ] **Step 2: Criar `frontend/src/api/types.ts`**

```ts
export interface Marco {
  titulo: string;
  descricao: string;
  percentual: number;
  data: string;
}

export interface Feedback {
  nome: string;
  cpf?: string;
  email?: string;
  tipo: "elogio" | "reclamacao" | "sugestao";
  titulo: string;
  descricao: string;
  dataEnvio: string;
  anexo?: string;
}

export interface Anexo {
  tipo: string;
  nomeArquivo: string;
  url?: string | null;
}

export interface Obra {
  _id: string;
  titulo: string;
  descricao: string;
  valorContratado: number;
  status: string;
  dataInicio: string;
  previsaoTermino: string;
  orgaoResponsavel: string;
  empresaExecutora: string;
  latitude?: number;
  longitude?: number;
  endereco: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  anexos: Anexo[];
  marcos: Marco[];
  feedbacks: Feedback[];
}

export interface Usuario {
  _id: string;
  gestor: boolean;
  dadosPessoais: {
    nomeCompleto: string;
    cpf: string;
    dataNascimento?: string;
    genero?: string;
  };
  contato: {
    email: string;
    telefone?: string;
  };
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  dadosProfissionais?: {
    orgaoInstituicao?: string;
    cargo?: string;
    experiencia?: string;
    areaAtuacao?: string;
  };
  aceitouTermos?: boolean;
  receberNotificacoes?: boolean;
}
```

- [ ] **Step 3: Criar `frontend/src/api/client.ts`**

```ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro na requisição: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
```

- [ ] **Step 4: Criar `frontend/src/api/auth.ts`**

```ts
import { api } from "./client";
import type { Usuario } from "./types";

export function login(email: string, senha: string, tipo: "cidadao" | "gestor") {
  return api.post<Usuario>("/auth/login", { email, senha, tipo });
}

export function logout() {
  return api.post<void>("/auth/logout");
}

export function getMe() {
  return api.get<Usuario>("/auth/me");
}
```

- [ ] **Step 5: Criar `frontend/src/api/usuarios.ts`**

```ts
import { api } from "./client";
import type { Usuario } from "./types";

export function cadastrarUsuario(dados: Record<string, unknown>) {
  return api.post<Usuario>("/usuarios", dados);
}

export function getUsuario(id: string) {
  return api.get<Usuario>(`/usuarios/${id}`);
}

export function atualizarUsuario(id: string, dados: Record<string, unknown>) {
  return api.patch<Usuario>(`/usuarios/${id}`, dados);
}
```

- [ ] **Step 6: Criar `frontend/src/api/obras.ts`**

```ts
import { api } from "./client";
import type { Feedback, Obra } from "./types";

export function listarObras() {
  return api.get<Obra[]>("/obras");
}

export function getObra(id: string) {
  return api.get<Obra>(`/obras/${id}`);
}

export function criarObra(dados: Partial<Obra>) {
  return api.post<Obra>("/obras", dados);
}

export function atualizarObra(id: string, dados: Partial<Obra>) {
  return api.put<Obra>(`/obras/${id}`, dados);
}

export function excluirObra(id: string) {
  return api.delete<void>(`/obras/${id}`);
}

export function enviarFeedback(obraId: string, dados: Omit<Feedback, "dataEnvio">) {
  return api.post<Obra>(`/obras/${obraId}/feedbacks`, dados);
}
```

- [ ] **Step 7: Criar `frontend/src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { Usuario } from "../api/types";

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string, tipo: "cidadao" | "gestor") => Promise<Usuario>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function refetch() {
    try {
      const u = await authApi.getMe();
      setUsuario(u);
    } catch {
      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  async function login(email: string, senha: string, tipo: "cidadao" | "gestor") {
    const u = await authApi.login(email, senha, tipo);
    setUsuario(u);
    return u;
  }

  async function logout() {
    await authApi.logout();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
```

- [ ] **Step 8: Envolver o `App` com `AuthProvider` em `frontend/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

function Placeholder({ nome }: { nome: string }) {
  return <div className="p-8 text-neutral-900">{nome}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Placeholder nome="Home" />} />
          <Route path="/login" element={<Placeholder nome="Login" />} />
          <Route path="/cadastro/cidadao" element={<Placeholder nome="Cadastro Cidadão" />} />
          <Route path="/cadastro/gestor" element={<Placeholder nome="Cadastro Gestor" />} />
          <Route path="/obras" element={<Placeholder nome="Obras" />} />
          <Route path="/obras/:id" element={<Placeholder nome="Obra Detalhe" />} />
          <Route path="/main" element={<Placeholder nome="Main" />} />
          <Route path="/editor" element={<Placeholder nome="Editor" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 9: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/api frontend/src/context frontend/src/App.tsx frontend/.env.development
git commit -m "feat(frontend): adiciona cliente de api, tipos e contexto de autenticacao"
```

---

## Task 10: Frontend no Docker Compose + smoke test full-stack

**Files:**
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: `frontend/Dockerfile` (Task 8), serviços `mongo`/`backend` (Task 7).
- Produces: `docker compose up` sobe os três serviços; frontend acessível em `http://localhost:5173` e conseguindo falar com o backend em `http://localhost:4000/api`.

- [ ] **Step 1: Adicionar o serviço `frontend` em `docker-compose.yml`**

```yaml
  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:4000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

- [ ] **Step 2: Subir tudo com um comando**

Run: `docker compose up --build`
Expected: os três containers sobem sem erro; logs do backend mostram o seed rodando; logs do frontend mostram o Vite pronto em `0.0.0.0:5173`.

- [ ] **Step 3: Smoke test manual no navegador**

Abrir `http://localhost:5173/obras` — deve renderizar o placeholder "Obras" sem erro no console.
Abrir o DevTools > Network, rodar no console do navegador:
```js
fetch("http://localhost:4000/api/obras", { credentials: "include" }).then(r => r.json()).then(console.log)
```
Expected: array com as 15 obras do seed, sem erro de CORS.
Depois: `Ctrl+C` no terminal do compose (não precisa `docker compose down`, as próximas tasks continuam usando os containers).

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(infra): adiciona servico frontend ao docker compose"
```

---

## Task 11: Página Home

**Files:**
- Create: `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/App.tsx` (trocar o placeholder de `/` por `<Home />`)

**Interfaces:**
- Consumes: `useAuth()` (Task 9), `listarObras()` (Task 9).
- Produces: componente `Home` exportado como default.

**Referência de comportamento:** ler `codigo/public/index.html` e `codigo/public/assets/js/script-home.js` (212 linhas) por completo antes de implementar.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/index.html codigo/public/assets/js/script-home.js`

- [ ] **Step 2: Implementar `frontend/src/pages/Home.tsx`**

Requisitos funcionais (extraídos da referência):
- Header com logo e, à direita: se `usuario` (do `useAuth()`) estiver logado, botão "Área do usuário" navegando para `/main`; senão, botão "Entrar" navegando para `/login`.
- Seção principal com CTA para `/obras` (listagem pública).
- Lista/preview de obras carregadas via `listarObras()` — renderizar título, status e bairro de cada uma (mesmos campos usados em `script-home.js`).
- Usar as classes Tailwind `bg-primary`, `hover:bg-primary-hover`, `text-neutral-900` etc. para reproduzir a paleta atual (ver `codigo/public/assets/css/style-home.css` para as cores exatas usadas em cada elemento).
- Estado de carregamento simples (texto "Carregando..." enquanto `listarObras()` não resolve) e tratamento de erro (mensagem se a requisição falhar).

- [ ] **Step 3: Trocar a rota `/` em `frontend/src/App.tsx`**

```tsx
import Home from "./pages/Home";
// ...
<Route path="/" element={<Home />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 5: Verificação manual no navegador**

Com `docker compose up` rodando (ou `npm run dev` no frontend + backend local), abrir `http://localhost:5173/`.
Expected: lista de obras do seed aparece na home; botão "Entrar" visível (sem login); paleta verde consistente com o app antigo (comparar com `http://localhost:5173` antes da migração não é possível, mas comparar visualmente com `codigo/public/assets/css/style-home.css`).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Home.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa pagina home em react"
```

---

## Task 12: Página Login

**Files:**
- Create: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useAuth().login(email, senha, tipo)` (Task 9).
- Produces: componente `Login` exportado como default.

**Referência de comportamento:** ler `codigo/public/modulos/login.html` e `codigo/public/assets/js/script-login.js` (46 linhas) por completo.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/modulos/login.html codigo/public/assets/js/script-login.js`

- [ ] **Step 2: Implementar `frontend/src/pages/Login.tsx`**

Requisitos funcionais:
- Formulário com campos `email`, `senha` e seletor `tipo` (`cidadao` | `gestor`), mesmos rótulos/opções do `login.html`.
- No submit: chamar `login(email, senha, tipo)`; em caso de sucesso, navegar para `/main` (via `useNavigate` do `react-router-dom`) — mesmo destino que o `script-login.js` original usa para ambos os tipos.
- Em caso de erro (a `Promise` rejeita), exibir a mensagem de erro retornada (`err.message`) em vez do `alert()` usado no original.
- Links para `/cadastro/cidadao` e `/cadastro/gestor` (o `login.html` atual referencia essas telas de cadastro).
- Estilo replicando `codigo/public/assets/css/style-login.css` via Tailwind (fundo, card centralizado, botão primário verde).

- [ ] **Step 3: Adicionar a rota em `frontend/src/App.tsx`**

```tsx
import Login from "./pages/Login";
// ...
<Route path="/login" element={<Login />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 5: Verificação manual**

Abrir `http://localhost:5173/login`. Usar um usuário do seed — ver `backend/src/seed/data.json` para um email/senha válidos de cidadão (ex.: `gustavohgordiano@gmail.com` / `gustavo21hl`, tipo cidadão) e de gestor (ex.: `carlos.gestor@prefeitura.gov` / `gestor123`, tipo gestor).
Expected: login com credenciais corretas navega para `/main`; login com senha errada mostra mensagem de erro na tela, sem navegar.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa pagina de login em react"
```

---

## Task 13: Página Cadastro de Cidadão

**Files:**
- Create: `frontend/src/pages/CadastroCidadao.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `cadastrarUsuario(dados)` (Task 9).
- Produces: componente `CadastroCidadao` exportado como default.

**Referência de comportamento:** ler `codigo/public/modulos/cadastro-cidadao.html` e `codigo/public/assets/js/script-cidadao.js` (127 linhas) por completo.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/modulos/cadastro-cidadao.html codigo/public/assets/js/script-cidadao.js`

- [ ] **Step 2: Implementar `frontend/src/pages/CadastroCidadao.tsx`**

Requisitos funcionais:
- Reproduzir todos os campos do formulário do `cadastro-cidadao.html` (dados pessoais, contato, endereço, senha), agrupados como no HTML original.
- No submit, montar o payload no formato `{ gestor: false, dadosPessoais: {...}, contato: {...}, endereco: {...}, seguranca: { password } }` e chamar `cadastrarUsuario(payload)`.
- Em caso de sucesso, navegar para `/login`.
- Em caso de erro (ex.: email já cadastrado — o backend responde 409), exibir a mensagem na tela.
- Validação client-side mínima: campos obrigatórios (`required` nos inputs), sem reescrever regras que o `script-cidadao.js` não tinha.
- Estilo via Tailwind replicando `codigo/public/assets/css/style-cidadao.css`.

- [ ] **Step 3: Adicionar a rota em `frontend/src/App.tsx`**

```tsx
import CadastroCidadao from "./pages/CadastroCidadao";
// ...
<Route path="/cadastro/cidadao" element={<CadastroCidadao />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 5: Verificação manual**

Abrir `http://localhost:5173/cadastro/cidadao`, preencher e enviar o formulário com um email novo.
Expected: navega para `/login`; login com o email/senha recém-cadastrados (tipo cidadão) funciona.
Repetir o cadastro com o mesmo email.
Expected: mensagem de erro "Email já cadastrado" exibida na tela.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/CadastroCidadao.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa pagina de cadastro de cidadao em react"
```

---

## Task 14: Página Cadastro de Gestor

**Files:**
- Create: `frontend/src/pages/CadastroGestor.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `cadastrarUsuario(dados)` (Task 9).
- Produces: componente `CadastroGestor` exportado como default.

**Referência de comportamento:** ler `codigo/public/modulos/cadastro-gestor.html` e `codigo/public/assets/js/script-gestor.js` (131 linhas) por completo.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/modulos/cadastro-gestor.html codigo/public/assets/js/script-gestor.js`

- [ ] **Step 2: Implementar `frontend/src/pages/CadastroGestor.tsx`**

Requisitos funcionais (mesma lógica do Task 13, adaptada para gestor):
- Reproduzir os campos do `cadastro-gestor.html`, incluindo os de `dadosProfissionais` (`orgaoInstituicao`, `cargo`, `experiencia`, `areaAtuacao`) e os checkboxes `aceitouTermos`/`receberNotificacoes` vistos em `script-gestor.js`.
- Payload: `{ gestor: true, dadosPessoais: {...}, contato: {...}, endereco: {...}, dadosProfissionais: {...}, seguranca: { password }, aceitouTermos, receberNotificacoes }`.
- Mesmo fluxo de sucesso/erro do Task 13 (navega para `/login` ou mostra erro).
- Estilo via Tailwind replicando `codigo/public/assets/css/style-gestor.css`.

- [ ] **Step 3: Adicionar a rota em `frontend/src/App.tsx`**

```tsx
import CadastroGestor from "./pages/CadastroGestor";
// ...
<Route path="/cadastro/gestor" element={<CadastroGestor />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 5: Verificação manual**

Abrir `http://localhost:5173/cadastro/gestor`, preencher e enviar com um email novo.
Expected: navega para `/login`; login com esse email (tipo gestor) funciona e, no Task 17 (Main), deve exibir o botão de área do gestor.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/CadastroGestor.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa pagina de cadastro de gestor em react"
```

---

## Task 15: Página Obras (listagem pública)

**Files:**
- Create: `frontend/src/pages/Obras.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `listarObras()` (Task 9).
- Produces: componente `Obras` exportado como default.

**Referência de comportamento:** ler `codigo/public/modulos/obras.html` e `codigo/public/assets/js/script-obras.js` (114 linhas) por completo.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/modulos/obras.html codigo/public/assets/js/script-obras.js`

- [ ] **Step 2: Implementar `frontend/src/pages/Obras.tsx`**

Requisitos funcionais:
- Carregar todas as obras via `listarObras()` e renderizar em grid de cards (título, status, bairro/cidade, valor formatado como moeda BRL).
- Ao clicar em um card, navegar para `/obras/:id` usando o `_id` da obra (substituindo a navegação por query string `?id=` do original, já que agora é rota).
- Botão "Voltar" navegando para `/`.
- Estado de carregamento e erro, como no Task 11.
- Estilo via Tailwind replicando `codigo/public/assets/css/style-obras.css`.

- [ ] **Step 3: Adicionar a rota em `frontend/src/App.tsx`**

```tsx
import Obras from "./pages/Obras";
// ...
<Route path="/obras" element={<Obras />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 5: Verificação manual**

Abrir `http://localhost:5173/obras`.
Expected: grid com as 15 obras do seed; clicar em um card navega para `/obras/<id-real>`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Obras.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa listagem publica de obras em react"
```

---

## Task 16: Página Obra Detalhe

**Files:**
- Create: `frontend/src/pages/ObraDetalhe.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `getObra(id)` (Task 9), `useParams()` do `react-router-dom`.
- Produces: componente `ObraDetalhe` exportado como default.

**Referência de comportamento:** ler `codigo/public/modulos/obra-detalhe.html` e `codigo/public/assets/js/script-obra-detalhe.js` (81 linhas) por completo.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/modulos/obra-detalhe.html codigo/public/assets/js/script-obra-detalhe.js`

- [ ] **Step 2: Implementar `frontend/src/pages/ObraDetalhe.tsx`**

Requisitos funcionais (baseados nas funções `carregarObra`, `formatarValor`, `preencherDadosObra`, `montarTimeline` do script original):
- Ler o `id` da obra via `useParams<{ id: string }>()` e buscar com `getObra(id)`.
- Exibir título, descrição, status, bairro, cidade, valor contratado formatado (`Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`), data de início e previsão de término.
- Renderizar uma timeline com os `marcos` da obra (título, descrição, percentual, data), na mesma ordem em que vêm da API.
- Botão "Voltar" navegando para `/obras`.
- Tratar obra não encontrada (404 do backend) mostrando uma mensagem, em vez de quebrar a página.
- Estilo via Tailwind replicando `codigo/public/assets/css/style-obra-detalhe.css`.

- [ ] **Step 3: Adicionar a rota em `frontend/src/App.tsx`**

```tsx
import ObraDetalhe from "./pages/ObraDetalhe";
// ...
<Route path="/obras/:id" element={<ObraDetalhe />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 5: Verificação manual**

Navegar de `/obras` para uma obra específica.
Expected: dados da obra e timeline de marcos aparecem corretamente; acessar uma URL com um `id` inexistente mostra mensagem de "obra não encontrada" em vez de tela em branco/erro no console.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/ObraDetalhe.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa pagina de detalhe da obra em react"
```

---

## Task 17: Página Main (dashboard do cidadão logado)

**Files:**
- Create: `frontend/src/pages/Main.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 9), `listarObras()`, `enviarFeedback()` (Task 9).
- Produces: componente `Main` exportado como default.

**Referência de comportamento:** ler `codigo/public/modulos/main.html` e `codigo/public/assets/js/script-main.js` (770 linhas) por completo — é a tela mais complexa do sistema.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/modulos/main.html && cat codigo/public/assets/js/script-main.js`

- [ ] **Step 2: Implementar `frontend/src/pages/Main.tsx`**

Requisitos funcionais (mapeados das funções do `script-main.js` original — reproduzir o comportamento de cada uma, adaptando de manipulação de DOM para estado/JSX React):
- Guarda de rota: se `useAuth().carregando` for `true`, mostrar "Carregando..."; se `usuario` for `null` após carregar, `useNavigate()` para `/login` (equivalente ao check em `window.addEventListener("DOMContentLoaded", ...)` do original, linha ~734–738).
- Sidebar/topbar com nome do usuário logado e botão de logout (`useAuth().logout()` + navegar para `/`).
- Se `usuario.gestor` for `true`, exibir um botão "Área do Gestor" navegando para `/editor` (equivalente ao `gestorBtn` do original, linha ~763–764).
- Grid de obras carregado via `listarObras()`, com filtro por texto (nome) e por status/bairro (equivalente a `filterObras`/`updateView`/`renderGrid`).
- Ao clicar em uma obra, abrir um painel/sidebar de detalhes (equivalente a `showDetalhesSidebar`) mostrando dados da obra, galeria de anexos (`renderImagesGallery`), progresso calculado a partir dos marcos (`calcularProgresso`) e feedbacks já enviados (`renderFeedbacksHtml`).
- Modal/formulário de envio de feedback (equivalente a `abrirModalFeedback`/`fecharModalFeedback`): campos `tipo` (elogio/reclamação/sugestão), `titulo`, `descricao`; usa `usuario.dadosPessoais.nomeCompleto`/`usuario.contato.email`/`usuario.dadosPessoais.cpf` como `nome`/`email`/`cpf` automaticamente (o usuário já está autenticado, não precisa redigitar). No submit, chamar `enviarFeedback(obraId, dados)` e atualizar a obra selecionada com a resposta.
- **Fora de escopo desta task:** o mapa interativo (`renderMap`, linha ~640) depende de uma biblioteca de mapas externa não mencionada no design; implementar essa seção como um bloco estático (ex.: lista de endereços das obras) em vez de integrar uma nova biblioteca de mapas — isso não está no escopo da refatoração de stack.
- Estilo via Tailwind replicando `codigo/public/assets/css/style-main.css`.

- [ ] **Step 3: Adicionar a rota em `frontend/src/App.tsx`**

```tsx
import Main from "./pages/Main";
// ...
<Route path="/main" element={<Main />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 5: Verificação manual**

Login como cidadão → deve cair em `/main` sem o botão "Área do Gestor".
Login como gestor → deve cair em `/main` com o botão "Área do Gestor" visível.
Abrir uma obra, enviar um feedback → deve aparecer na lista de feedbacks daquela obra sem precisar recarregar a página.
Acessar `/main` sem estar logado (aba anônima) → deve redirecionar para `/login`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Main.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa dashboard main do cidadao em react"
```

---

## Task 18: Página Editor de Obras (gestor)

**Files:**
- Create: `frontend/src/pages/EditorObras.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `listarObras()`, `criarObra()`, `atualizarObra()`, `excluirObra()` (Task 9).
- Produces: componente `EditorObras` exportado como default.

**Referência de comportamento:** ler `codigo/public/modulos/editorObras.html` e `codigo/public/assets/js/script-editor.js` (925 linhas) por completo — segunda tela mais complexa do sistema.

- [ ] **Step 1: Ler os arquivos de referência**

Run: `cat codigo/public/modulos/editorObras.html && cat codigo/public/assets/js/script-editor.js`

- [ ] **Step 2: Implementar `frontend/src/pages/EditorObras.tsx`**

Requisitos funcionais (mapeados do `script-editor.js` original):
- Guarda de rota: exigir `usuario` autenticado E `usuario.gestor === true`; se não autenticado, `useNavigate()` para `/login` (equivalente às checagens nas linhas ~896–917 do original); se autenticado mas não gestor, mostrar mensagem "Acesso restrito a gestores" com link para `/main`.
- Lista de obras do gestor (todas as obras — o `db.json` atual não associa obra a um gestor específico, então listar todas, como o original faz).
- Formulário de criação/edição de obra (equivalente ao fluxo em torno da linha ~198–210: `isEdicao` decide entre criar e editar), com os campos: `titulo`, `descricao`, `valorContratado`, `status`, `dataInicio`, `previsaoTermino`, `orgaoResponsavel`, `empresaExecutora`, endereço completo.
- Editor de marcos dentro do formulário da obra (equivalente à criação de marco na linha ~306, que gerava `id` client-side — na versão nova, marcos são um array simples sem id próprio, gerenciados como parte do estado do formulário): adicionar/remover/editar marcos (`titulo`, `descricao`, `percentual`, `data`) antes de salvar a obra inteira.
- Ao salvar: se for edição, chamar `atualizarObra(id, dadosCompletos)` (PUT, substituição completa — inclui os `marcos` e mantém os `feedbacks` existentes da obra); se for criação, chamar `criarObra(dadosCompletos)`.
- Botão de excluir obra chamando `excluirObra(id)` com confirmação (`window.confirm`).
- Visualização (somente leitura) dos feedbacks recebidos em cada obra, sem opção de edição/exclusão (o `script-editor.js` original não edita feedbacks, só exibe).
- Botão de logout (`useAuth().logout()` + navegar para `/`), equivalente à linha ~896 do original.
- Estilo via Tailwind replicando `codigo/public/assets/css/style-editor.css`.

- [ ] **Step 3: Adicionar a rota em `frontend/src/App.tsx`**

```tsx
import EditorObras from "./pages/EditorObras";
// ...
<Route path="/editor" element={<EditorObras />} />
```

- [ ] **Step 4: Verificar tipos**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 5: Verificação manual**

Login como gestor → ir em `/main` → clicar "Área do Gestor" → cair em `/editor`.
Criar uma obra nova com 2 marcos → salvar → deve aparecer na lista e em `/obras`.
Editar essa obra (mudar status e adicionar um 3º marco) → salvar → conferir em `/obras/:id` que o novo status e os 3 marcos aparecem.
Excluir a obra → confirmar que some da listagem e que `GET /api/obras/:id` retorna 404.
Login como cidadão e tentar acessar `/editor` diretamente pela URL → deve mostrar "Acesso restrito a gestores", não o formulário.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/EditorObras.tsx frontend/src/App.tsx
git commit -m "feat(frontend): implementa editor de obras do gestor em react"
```

---

## Task 19: Remover a implementação legada e atualizar o `package.json` raiz

**Files:**
- Delete: `codigo/` (pasta inteira)
- Modify: `package.json` (raiz)

**Interfaces:**
- Consumes: nenhuma (todas as funcionalidades já foram migradas nas Tasks 1–18).

- [ ] **Step 1: Confirmar que todas as páginas foram migradas**

Run: `git log --oneline | grep "feat(frontend)"`
Expected: 8 commits (Home, Login, CadastroCidadao, CadastroGestor, Obras, ObraDetalhe, Main, EditorObras).

- [ ] **Step 2: Remover a pasta legada**

Run: `git rm -r codigo`

- [ ] **Step 3: Atualizar `package.json` da raiz**

Ler o `package.json` atual e substituir seu conteúdo, removendo as dependências do stack antigo (`cors`, `express`, `json-server`, `path`) e o script `test` fake, mantendo `name`, `description`, `repository`, `license`, `bugs`, `homepage`:

```json
{
  "name": "pmg-es-2025-2-ti1-2401100-obraspublicas",
  "version": "2.0.0",
  "description": "O projeto tem como objetivo criar uma plataforma digital que centralize informações sobre obras públicas em Belo Horizonte, reunindo dados como prazos, custos, status de execução e responsáveis. A ideia é transformar informações que hoje são dispersas e burocráticas em algo acessível, transparente e fácil de entender pela população.",
  "private": true,
  "scripts": {
    "dev": "docker compose up --build"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2025-2-ti1-2401100-obraspublicas.git"
  },
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2025-2-ti1-2401100-obraspublicas/issues"
  },
  "homepage": "https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2025-2-ti1-2401100-obraspublicas#readme"
}
```

- [ ] **Step 4: Validar que o compose completo ainda sobe do zero**

Run: `docker compose down -v && docker compose up --build -d && sleep 8 && curl -s http://localhost:4000/api/health && curl -s http://localhost:5173 | head -c 200`
Expected: health check `{"status":"ok"}`; frontend responde HTML. Depois: `docker compose down`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove implementacao legada em vanilla js e json-server"
```

---

## Task 20: Nova seção no README descrevendo a refatoração

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: nenhuma.

- [ ] **Step 1: Ler o `README.md` atual**

Run: `cat README.md`

- [ ] **Step 2: Inserir a nova seção logo após o parágrafo/link de abertura, antes de "## Alunos integrantes da equipe"**

```markdown
## Refatoração da stack (2026)

O projeto foi containerizado e migrado para uma stack moderna, mantendo a identidade visual e as funcionalidades originais:

- **Orquestração:** Docker Compose — todo o ambiente (frontend, backend e banco) sobe com um único comando.
- **Frontend:** React + TypeScript + Tailwind CSS (antes: HTML/CSS/JS vanilla).
- **Backend:** Node.js + TypeScript + Express, responsável pela autenticação (login com senha hasheada e JWT em cookie httpOnly) e por todas as requisições ao banco (antes: json-server).
- **Banco de dados:** MongoDB (antes: arquivo `db.json`).

### Como rodar localmente

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend (API): http://localhost:4000/api

Na primeira subida, o banco é populado automaticamente com os dados de exemplo já usados no projeto.
```

- [ ] **Step 3: Conferir visualmente**

Run: `head -n 40 README.md`
Expected: a nova seção aparece entre o parágrafo de abertura/link do Render e "## Alunos integrantes da equipe".

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: adiciona secao sobre a refatoracao da stack no readme"
```

---

## Verificação final (não é uma task de código — checklist de aceite)

- [ ] `docker compose up --build` sobe os três serviços sem erro a partir de um clone limpo.
- [ ] `http://localhost:5173/` carrega a Home com a paleta verde original.
- [ ] Cadastro de cidadão → login → dashboard `/main` funciona ponta a ponta.
- [ ] Cadastro de gestor → login → `/editor` → criar/editar/excluir obra funciona ponta a ponta.
- [ ] Enviar feedback em uma obra via `/main` reflete em `/obras/:id`.
- [ ] Reiniciar os containers (`docker compose restart`) não duplica o seed (checagem de coleção vazia no Task 6).
- [ ] `codigo/` não existe mais no repositório.
- [ ] README tem a nova seção de refatoração perto do topo.
