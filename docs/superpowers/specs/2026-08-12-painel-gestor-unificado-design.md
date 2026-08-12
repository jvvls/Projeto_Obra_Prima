# Painel do Gestor Unificado — Design

## Contexto

Hoje o fluxo do gestor está espalhado por telas desconectadas:

- `/main` — dashboard estilo cidadão (grade/lista de obras, filtros), com um botão "Painel do Gestor" que leva para `/editor`.
- `ObraDetalhesPanel` (drawer sobreposto em `/main`) — mostra resumo, linha do tempo e feedbacks de uma obra, mas é somente leitura e não tem gestão de marcos nem edição de dados da obra.
- `/editor` (`EditorObras.tsx`) — página isolada com formulário de criar/editar obra + gestão de marcos + lista de obras cadastradas, mas **sem** visão de feedbacks recebidos.

Para editar uma obra e depois ver o feedback que os cidadãos deixaram sobre ela, o gestor precisa sair do `/editor`, ir para `/main`, achar a obra de novo e abrir o painel lateral. Este spec consolida tudo em uma única tela.

Este é o primeiro de dois sub-projetos: modernizar a tela do gestor primeiro (aqui), e usar o resultado como referência visual para modernizar as demais páginas do site depois, em um spec separado.

## Escopo

**Dentro do escopo:**
- Nova página `/gestor` que substitui `/editor`, unificando lista de obras, criação/edição, gestão de marcos e visualização de feedbacks em uma única tela (layout master-detail).
- Atualização do link "Painel do Gestor" em `/main` para apontar para `/gestor`.
- Refinamento visual da tela do gestor (paleta atual mantida, mas com espaçamento, sombras, tipografia e badges de status modernizados).

**Fora do escopo (fica para o próximo spec):**
- Redesign de `/main`, `/`, `/login`, `/cadastro/*`, `/obras`, `/obras/:id`.
- Qualquer mudança de API/backend.
- Remoção do `ObraDetalhesPanel` usado pelo cidadão em `/main` (continua como está — é a experiência do cidadão, não do gestor).

## Arquitetura

- Nova página `frontend/src/pages/GestaoObras.tsx`, montada na rota `/gestor` em `App.tsx`, substituindo a rota `/editor` e o import de `EditorObras`.
- Acesso continua restrito a `usuario.gestor` — mesma verificação de guarda que existe hoje em `EditorObras.tsx` (mensagem de "Acesso restrito a gestores" com link de volta para `/main`).
- Em `Main.tsx`, o botão "Painel do Gestor" passa a navegar para `/gestor`.
- `EditorObras.tsx` é removido (funcionalidade migra inteiramente para `GestaoObras.tsx`).
- Sem mudanças de backend: reaproveita `listarObras`, `criarObra`, `atualizarObra`, `excluirObra` de `frontend/src/api/obras.ts`. Feedbacks já vêm embutidos em `Obra.feedbacks`, então não é necessária nenhuma nova chamada de API.

## Layout — master-detail

### Cabeçalho
Mesmo padrão visual do header de `Main.tsx`/`EditorObras.tsx` (logo, título, navegação, sair), mais uma faixa de estatísticas rápidas logo abaixo: total de obras, obras em andamento, obras concluídas, total de feedbacks recebidos — calculadas a partir do array `obras` já carregado (mesmo padrão de `useMemo` usado em `Home.tsx`).

### Painel esquerdo — lista de obras (gestão densa)
- Campo de busca por texto (título, empresa, cidade, órgão) — reaproveita a lógica de filtro já existente em `EditorObras.tsx`.
- Filtros de status e cidade (selects, populados dinamicamente a partir das obras carregadas).
- Botão fixo **"+ Nova obra"** no topo da lista.
- Cada linha da lista mostra: título, badge de status colorido, cidade, valor contratado, barra de progresso (calculada a partir dos marcos) e contagem de feedbacks recebidos.
- Clicar em uma linha seleciona a obra e a exibe no painel direito. A linha selecionada fica destacada.

### Painel direito — detalhe/edição da obra selecionada
Sempre visível ao lado da lista (não é mais um drawer sobreposto). Três abas:

1. **Editar** — formulário de dados da obra, idêntico em campos ao formulário atual de `EditorObras.tsx` (título, descrição, valor, status, datas, órgão/empresa, endereço), mais a gestão de marcos (adicionar/editar/remover, com barra de progresso calculada) que hoje já vive dentro do mesmo formulário.
2. **Linha do tempo** — visualização somente leitura dos marcos em ordem cronológica/percentual, no mesmo estilo visual usado hoje em `ObraDetalhesPanel` (título, percentual, descrição, data). Serve como pré-visualização do que o cidadão vê.
3. **Feedbacks** — lista somente leitura dos feedbacks recebidos (tipo, título, descrição, autor, data), reaproveitando o layout já usado na aba "Feedbacks" de `ObraDetalhesPanel`. Sem botão de "adicionar feedback" (isso é uma ação do cidadão, não do gestor).

Ao clicar em "+ Nova obra", o painel direito abre na aba **Editar** com formulário vazio. As abas "Linha do tempo" e "Feedbacks" ficam com um estado vazio explicativo ("Salve a obra para acompanhar feedbacks e linha do tempo publicada") até a obra ser salva pela primeira vez — os marcos adicionados antes do primeiro salvamento continuam sendo geridos dentro da própria aba Editar, como já funciona hoje.

## Estilo visual

Evolução da identidade atual, não uma repaginação completa:

- Paleta verde (`primary`) e marca Obra Prima mantidas.
- Espaçamento mais generoso entre seções e cartões.
- Sombras suaves e consistentes (`shadow-sm`/`shadow-md`) em vez de bordas simples onde hoje há só `border`.
- Cantos arredondados padronizados (`rounded-xl`/`rounded-2xl`) em cartões, botões e inputs.
- Badges de status com cor própria por status — verde para "Concluída", âmbar para "Em andamento", vermelho para "Paralisada", cinza para "Planejada" — substituindo o badge único na cor `primary` usado hoje para todos os status.
- Hierarquia tipográfica mais clara entre títulos de seção, labels e corpo de texto.

## Tratamento de erros

Mantém as validações já existentes: título obrigatório ao salvar obra, percentual do marco entre 0 e 100, mensagens de erro inline abaixo do formulário (mesmo padrão atual). Sem novos casos de erro introduzidos — a consolidação é estrutural/visual, não funcional.

## Verificação

Checklist manual no navegador (não há suíte de testes automatizados no frontend hoje):

1. Login como gestor → `/gestor` carrega a lista de obras e as estatísticas do topo.
2. Criar uma obra nova pelo botão "+ Nova obra", incluindo marcos, e salvar.
3. Selecionar uma obra existente, editar dados e marcos, salvar.
4. Conferir a aba "Linha do tempo" refletindo os marcos salvos.
5. Conferir a aba "Feedbacks" mostrando os feedbacks já existentes de uma obra (ex.: dado de seed).
6. Excluir uma obra e confirmar que ela some da lista.
7. Login como cidadão (não-gestor) tentando acessar `/gestor` diretamente → vê mensagem de acesso restrito.
8. Confirmar que `/main` (dashboard do cidadão) e `ObraDetalhesPanel` continuam funcionando sem alterações.
9. Confirmar que o botão "Painel do Gestor" em `/main` leva para `/gestor`.
