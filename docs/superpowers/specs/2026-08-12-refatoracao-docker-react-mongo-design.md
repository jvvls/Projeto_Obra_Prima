# Refatoração: Docker Compose + React/TS/Tailwind + Backend Node/TS + MongoDB

## Contexto

O projeto hoje roda como um monólito simples: `codigo/index.js` (Express) serve os arquivos estáticos de `codigo/public/` (HTML/CSS/JS vanilla) e delega `/api` para o `json-server`, que lê/escreve em `codigo/db/db.json`. O login é feito inteiramente no client: busca todos os usuários via `fetch` e compara a senha em texto puro no navegador. Não há containerização — rodar local exige instalar dependências e subir o processo Node diretamente.

Esta refatoração moderniza a stack mantendo a identidade visual e as funcionalidades atuais:

- **Containerização total** com Docker Compose, subindo tudo com um único comando.
- **Frontend**: migração de vanilla JS para React + TypeScript + Tailwind, preservando a paleta de cores atual.
- **Backend**: novo serviço Node + TypeScript (Express) responsável por autenticação e por todas as requisições ao banco (substitui o `json-server` por completo).
- **Banco de dados**: troca do `db.json` por MongoDB.
- **README**: nova seção próxima ao topo descrevendo essa refatoração.

Escopo definido com o usuário: o backend novo assume 100% das rotas de dados (não só login); senhas passam a ser hasheadas com bcrypt e o login retorna JWT em cookie httpOnly; a migração do front cobre todas as telas atuais; os dados de `db.json` viram seed automático do Mongo; deploy em produção (Render) fica fora de escopo — o foco é rodar local via `docker compose up`.

## Inventário funcional atual (referência para a migração)

Páginas/módulos em `codigo/public/`:
- `index.html` + `script-home.js` — home pública, lista de obras, estado de login.
- `modulos/login.html` + `script-login.js` — login (cidadão/gestor).
- `modulos/cadastro-cidadao.html` + `script-cidadao.js` — cadastro de cidadão.
- `modulos/cadastro-gestor.html` — cadastro de gestor/empresa.
- `modulos/obras.html` + `script-obras.js` — listagem pública de obras.
- `modulos/obra-detalhe.html` + `script-obra-detalhe.js` — detalhe de uma obra, com marcos e feedbacks.
- `modulos/main.html` + `script-main.js` — dashboard do cidadão logado (perfil, obras acompanhadas, envio de feedback).
- `modulos/editorObras.html` + `script-editor.js` — editor de obras do gestor (CRUD de obras, marcos, feedbacks).

Entidades em `codigo/db/db.json`:
- `usuarios`: dados pessoais, contato, endereço, flag `gestor`, `seguranca.password` (hoje em texto puro), e para gestores `dadosProfissionais`.
- `obras`: dados da obra, endereço, `anexos`, `marcos[]` (percentual/data/descrição) e `feedbacks[]` (tipo elogio/reclamação/sugestão).

O comportamento funcional de cada tela é o já implementado nos arquivos acima — a migração deve preservá-lo; o código-fonte atual é a referência de comportamento, não este documento.

## Paleta de cores (preservar no Tailwind)

Extraída dos CSS atuais (`codigo/public/assets/css/*.css`):
- Primária (verde): `#27ae60` (base), `#219150` / `#1e8b4a` (hover/dark), `#1b7742` (dark forte), `#2ecc71` (accent claro).
- Neutros de texto: `#333`, `#555`, `#666`, `#999`.
- Fundos claros: `#fff`, `#f7faf8`, `#f5f5f5`, `#f0f0f0`.
- Bordas: `#e0e0e0`, `#ddd`.
- Estado de erro (usado em feedback/validação): `#fee2e2` / `#fff5f5`.

Essas cores serão mapeadas para `tailwind.config` como `primary` (escala baseada no verde) e tokens neutros equivalentes, para que os componentes React usem classes utilitárias em vez de recriar os CSS atuais.

## Arquitetura

```
/
├── docker-compose.yml
├── frontend/                  # Vite + React + TS + Tailwind
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── main.tsx / App.tsx      (React Router)
│       ├── pages/                  # Home, Login, CadastroCidadao, CadastroGestor,
│       │                           # Obras, ObraDetalhe, Main, EditorObras
│       ├── components/             # componentes compartilhados (header, footer, cards)
│       ├── api/                    # cliente fetch (credentials: "include") + tipos TS das entidades
│       └── context/                # contexto de sessão (usuário logado)
└── backend/                   # Node + TS + Express + Mongoose
    ├── Dockerfile
    └── src/
        ├── models/                 # Usuario, Obra (schemas Mongoose)
        ├── routes/                 # auth, usuarios, obras
        ├── middleware/             # verifyAuth (JWT via cookie), requireGestor
        ├── seed/                   # popula o Mongo a partir dos dados atuais de db.json
        └── server.ts
```

A pasta `codigo/` (implementação vanilla atual) é removida ao final da migração; o histórico do git preserva o código antigo.

## Backend

- Stack: Express + TypeScript + Mongoose, rodando com `tsx watch` no compose (hot reload).
- Autenticação: `POST /api/auth/login` valida email + senha (via `bcrypt.compare`) + tipo (cidadão/gestor), assina um JWT e seta como cookie httpOnly (`Set-Cookie`, `SameSite=Lax`, `Secure` desabilitado em dev). `POST /api/auth/logout` limpa o cookie. `GET /api/auth/me` retorna o usuário autenticado a partir do cookie.
- Cadastro: `POST /api/usuarios` (cidadão ou gestor, conforme payload) hasheia a senha com bcrypt antes de persistir.
- Usuários: `GET /api/usuarios/:id`, `PATCH /api/usuarios/:id` (autenticado, só o próprio usuário).
- Obras: `GET /api/obras`, `GET /api/obras/:id`, `POST /api/obras` (gestor), `PATCH /api/obras/:id` (gestor), `DELETE /api/obras/:id` (gestor).
- Marcos e feedbacks como sub-recursos de obra (ex.: `POST /api/obras/:id/marcos`, `POST /api/obras/:id/feedbacks`), mantendo o mesmo formato de dados hoje aninhado em `obras`.
- Middleware `verifyAuth` lê o JWT do cookie e injeta o usuário na request; `requireGestor` bloqueia rotas de escrita de obras para quem não é gestor.
- CORS configurado com `origin` do frontend e `credentials: true` (necessário para cookie httpOnly cross-origin entre os containers).

## Frontend

- Stack: Vite + React + TypeScript + React Router + Tailwind CSS.
- Uma página por módulo atual (ver inventário funcional). Componentes compartilhados (header/nav, footer, cards de obra) extraídos onde o CSS atual já os trata como blocos reutilizáveis.
- Cliente de API único em `src/api/` com funções tipadas por entidade (`Usuario`, `Obra`, `Marco`, `Feedback`), todas as chamadas usando `credentials: "include"` para enviar o cookie de sessão.
- Estado de sessão (usuário logado) em um contexto React, hidratado via `GET /api/auth/me` no load — substitui o `localStorage.getItem("usuarioLogado")` atual.
- Tailwind configurado com a paleta extraída (seção acima); reconstrução dos estilos atuais como utilitárias, preservando layout e cores, não pixel-perfect nos detalhes de CSS bruto.

## MongoDB e seed

- Duas coleções: `usuarios` e `obras`, mesmo formato de dados hoje usado (obras com `marcos` e `feedbacks` embutidos).
- Container `mongo` oficial, com volume nomeado para persistência entre `docker compose up`s.
- Script de seed (`backend/src/seed`) roda no start do backend: se as coleções estiverem vazias, importa os dados de `codigo/db/db.json` (antes de essa pasta ser removida, os dados são copiados para `backend/src/seed/data.json`), gerando hash bcrypt para cada senha em vez de gravá-la em texto puro.

## Docker Compose

Serviços:
- `mongo`: imagem oficial `mongo`, volume nomeado, sem porta exposta ao host (só a rede interna do compose).
- `backend`: build de `backend/Dockerfile` (dev, com `tsx watch`), depende de `mongo`, variáveis `MONGO_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_ORIGIN`; volume montado no código-fonte para hot reload.
- `frontend`: build de `frontend/Dockerfile` (dev, com o dev server do Vite), depende de `backend`, variável `VITE_API_URL`; volume montado no código-fonte para hot reload.

Comando único: `docker compose up --build`.

## README

Nova seção inserida logo após o parágrafo de abertura do projeto (antes de "Alunos integrantes da equipe"), descrevendo: a stack pós-refatoração (Docker Compose, React + TS + Tailwind, Node + TS + Express, MongoDB) e o comando para rodar local (`docker compose up --build`).

## Fora de escopo

- Deploy em produção (Render ou outro) — só desenvolvimento local via Compose.
- Testes automatizados (não solicitados).
- Qualquer redesign visual além da tradução do CSS atual para Tailwind — a paleta e o layout devem ser preservados, não reinventados.
