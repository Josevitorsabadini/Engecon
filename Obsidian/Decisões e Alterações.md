---
title: Decisões e Alterações — Engecon
tags:
  - decisões
  - log
  - sessões
aliases:
  - log
  - decisões
  - alterações
---

→ [[ÍNDICE]]

# Decisões e Alterações

> [!tip] Instruções para o Claude
> Ao final de qualquer sessão onde uma **decisão foi tomada**, **algo mudou no escopo**, **uma abordagem foi escolhida** ou **um problema foi resolvido de forma não óbvia** — registre aqui.
>
> **Quando registrar:**
> - Decisões de arquitetura ou tecnologia (ex: "escolhemos X em vez de Y por causa de Z")
> - Mudanças no escopo, banco de dados ou módulos
> - Problemas encontrados e como foram resolvidos
> - Qualquer coisa que, se esquecida, causaria confusão ou retrabalho
>
> **Quando NÃO registrar:**
> - Implementações de rotina sem decisão relevante
> - Correções triviais de bug
> - Contexto que já está documentado nos outros arquivos
>
> **Formato:** use o template abaixo. Entradas mais recentes ficam no topo.

---

> [!example] Template de entrada
> ```
> ## [AAAA-MM-DD] — Título curto
> 
> **Contexto:** o que estava sendo feito / qual era o problema
> **Decisão:** o que foi decidido ou alterado
> **Motivo:** por que essa escolha (e não outra)
> **Impacto:** o que muda no projeto (arquivos, fases, banco, etc.)
> ```

---

## Entradas

## 2026-05-09 — Fase 5 concluída — Módulo Produtos e Estoque

**Contexto:** Fase 5 iniciada. Três decisões de produto definidas antes da implementação.

**Decisão:**
1. **Ajuste manual de estoque via `tipo: 'ajuste'` em movimentações** — mantém auditoria completa na tabela `movimentacoes`. Restrição extra no código: apenas `administrador` pode criar ajustes (mesmo que o preHandler permita editor). Migration `20260509000000_add_ajuste_tipo_movimentacao` necessária no Supabase.
2. **`codigo` do produto é imutável** — não aparece no PATCH. Soft-delete com `codigo` único: se produto inativo tem o código, a mensagem de erro orienta a contatar o administrador para reativação.
3. **Estoque criado automaticamente com `quantidade=0` ao criar produto** — todos os produtos aparecem na listagem de estoque desde o cadastro.
4. **`valorUnitario` da movimentação `ajuste` é opcional** — se não informado, usa o valor atual do estoque. O valor é gravado na movimentação para manter `valorTotal` gerado coerente.

**Motivo:**
- `ajuste` via movimentação: auditoria completa, sem endpoint paralelo que burlaria o log.
- Admin-only para ajuste: correção de inventário é operação sensível — editor não deve poder alterar arbitrariamente o estoque.
- Estoque com `quantidade=0` desde o cadastro: frontend pode mostrar o catálogo com posição de estoque sem depender de ter ocorrido movimentações.

**Impacto:**
- `prisma/schema.prisma` — `ajuste` adicionado ao enum `TipoMovimentacao`
- `prisma/migrations/20260509000000_add_ajuste_tipo_movimentacao/migration.sql` — criado (aplicar no Supabase)
- `package.json` — script `db:resolve:3` adicionado
- `src/modules/movimentacoes/movimentacoes.schema.ts` — `ajuste` adicionado, `valorUnitario` agora opcional com superRefine
- `src/modules/movimentacoes/movimentacoes.service.ts` — bloco `ajuste` adicionado
- `src/modules/movimentacoes/movimentacoes.routes.ts` — guarda admin-only para `ajuste`
- `src/modules/produtos/` — criado (schema + service + routes): CRUD completo
- `src/modules/estoque/` — criado (schema + service + routes): leitura com filtro por perfil
- `src/app.ts` — rotas `/produtos` e `/estoque` registradas
- `Padrões de Desenvolvimento.md` — migration e workflow de frontend adicionados

---

## 2026-05-09 — Fase 4 concluída — Módulo Movimentações

**Contexto:** Fase 4 iniciada. Pré-requisitos e módulo completo de movimentações implementados.

**Decisão:**
1. **`authorize` decorator** criado em `src/app.ts` junto ao `authenticate`. Recebe lista de perfis e retorna 403 se o perfil do usuário autenticado não estiver na lista.
2. **`createLog` helper** criado em `src/lib/log.ts`. Aceita parâmetro opcional `tx` (cliente de transação Prisma) — permite chamada dentro ou fora de uma transação.
3. **`createLog` é chamado dentro da transação** que cria a movimentação e atualiza o estoque. Garante que log e operação sejam atômicos — nunca há log sem operação ou operação sem log.
4. **Proteção contra race condition em `saida`**: em vez de ler o estoque e validar, usa `updateMany` com `WHERE quantidade >= saida`. Se nenhuma linha for atualizada (`count === 0`), retorna 409. Isso evita que duas saídas concorrentes ultrapassem o saldo sem locks explícitos.
5. **`entrada`** usa `upsert` no estoque — cria o registro se não existir (primeiro entrada do produto) ou incrementa quantidade e atualiza `valorUnitario`.
6. **`transferencia`** não altera o estoque (quantidade global é preservada). Apenas registra o movimento com origem/destino.
7. **Filtragem para `leitor`**: campos `quantidade`, `valorUnitario` e `valorTotal` removidos da resposta nas rotas `GET /movimentacoes` e `GET /movimentacoes/:id` quando o perfil é `leitor`.

**Motivo:**
- Log dentro da transação: auditoria nunca pode divergir da operação real.
- `updateMany` com WHERE: solução atômica sem precisar de `SELECT FOR UPDATE` explícito — PostgreSQL trava a linha durante o UPDATE, garantindo serialização.
- `upsert` para entrada: Fase 5 ainda não criou os registros iniciais de estoque; upsert absorve os dois casos sem condicional extra.

**Impacto:**
- `src/lib/log.ts` — criado
- `src/app.ts` — import de `movimentacoesRoutes` + decorator `authorize` + registro da rota `/movimentacoes`
- `src/modules/movimentacoes/movimentacoes.schema.ts` — criado
- `src/modules/movimentacoes/movimentacoes.service.ts` — criado
- `src/modules/movimentacoes/movimentacoes.routes.ts` — criado

---

## 2026-05-08 — Documentação completada para autonomia entre sessões

**Contexto:** Auditoria revelou que a documentação não era suficiente para uma sessão sem contexto iniciar a Fase 4 sem retrabalho.

**Decisão:** Corrigir todas as lacunas identificadas:
1. `JWT_EXPIRES_IN` corrigido de 15min para **30min** em todos os arquivos (ÍNDICE, Escopo, Decisões, `.env.example`)
2. Criado `Arquitetura/Padrões de Desenvolvimento.md` com: comandos para rodar o projeto, fluxo de migrations (SQL manual + `db:resolve`), padrão de módulo (schema/service/routes), e especificação dos dois pré-requisitos da Fase 4 (`authorize` + `createLog`)
3. `Cronograma/Fases.md` — Fase 4 expandida com: bloco de pré-requisitos e tabela de regras de negócio do impacto no estoque por tipo de movimentação
4. `ÍNDICE.md` — link para Padrões de Desenvolvimento adicionado

**Motivo:** O Obsidian deve ser suficiente para que qualquer sessão futura entenda o estado atual, o que falta construir e como construir — sem precisar ler o código-fonte para descobrir padrões ou decisões não óbvias.

**Impacto:** Nenhum código alterado. Apenas documentação.

---

## 2026-05-08 — Fase 3 concluída — Banco de dados completo

**Contexto:** Schema Prisma e migrations já aplicados no Supabase. Faltavam dois itens para encerrar a fase.

**Decisão:**
1. Adicionados `@@index` no `schema.prisma` espelhando exatamente os 13 índices criados via SQL manual (`idx_colaboradores_usuario`, `idx_alocacoes_*`, `idx_movimentacoes_*`, `idx_logs_*`). O índice `idx_estoque_produto` foi omitido por ser redundante com a constraint `@unique` já existente em `produto_id`.
2. Criado `prisma/seed.ts` com: upsert do admin via `SEED_ADMIN_EMAIL/PASSWORD/NOME` do `.env`; upsert de 1 fornecedor (CNPJ único), 1 depósito e 1 obra (IDs fixos para idempotência), 5 produtos de construção civil (código único). Script registrado em `package.json` → `"prisma": { "seed": "tsx prisma/seed.ts" }`.

**Motivo:** `@@index` mantém o schema como fonte de verdade sem depender da memória das migrations manuais. Seed idempotente evita duplicação em múltiplas execuções.

**Impacto:**
- `prisma/schema.prisma` — `@@index` adicionados em `Colaborador`, `Alocacao`, `Movimentacao`, `Log`
- `prisma/seed.ts` — criado
- `package.json` — script `db:seed` + bloco `"prisma": { "seed": ... }`
- `.env.example` — variáveis `SEED_ADMIN_*` documentadas

---

## 2026-05-07 — Fase 2 concluída — Autenticação (JWT + refresh token + brute-force)

**Contexto:** Fase 1 entregue. Iniciando Fase 2 conforme cronograma.

**Decisão:** Refresh token armazenado como UUID opaco na tabela `refresh_tokens` (não como JWT assinado). Access token é JWT de 30min. Brute-force em memória (Map) — sem Redis ou banco para essa camada.

**Motivo:** UUID opaco é mais simples que JWT como refresh token e facilita invalidação direta no banco. Brute-force in-memory é suficiente para implantação local single-instance; se escalar, migra para Redis.

**Impacto:**
- `prisma/schema.prisma` — novo model `RefreshToken` (uuid, usuario_id, expires_at)
- `prisma/migrations/20260507000001_add_refresh_tokens/migration.sql` — migration criada
- `src/lib/brute-force.ts` — tracker em memória: bloqueia após 5 falhas por 15 min
- `src/lib/errors.ts` — classe `AppError` com `statusCode` para uso no service
- `src/modules/auth/auth.schema.ts` — schema Zod para login
- `src/modules/auth/auth.service.ts` — lógica de login/refresh/logout com bcryptjs
- `src/modules/auth/auth.routes.ts` — POST /auth/login, /auth/refresh, /auth/logout
- `src/app.ts` — registra @fastify/cookie, @fastify/jwt, decorator `authenticate`, auth routes

---

## 2026-05-07 — Fase 1 concluída — Segurança base do Fastify

**Contexto:** Fase 0 entregue (estrutura, schema Prisma, app.ts mínimo). Iniciando Fase 1 conforme cronograma.

**Decisão:** Implementar Helmet, CORS, rate limiting e error handler centralizado diretamente no `app.ts`, com `buildApp` convertido para `async`.

**Motivo:** Todos os plugins de segurança precisam estar registrados no escopo raiz do Fastify para cobrir todas as rotas. A abordagem direta (sem wrapper `fastify-plugin`) é mais simples e suficiente para o escopo atual.

**Impacto:**
- `src/app.ts` — async, registra helmet + cors + rateLimit, `setErrorHandler`, `setNotFoundHandler`
- `src/plugins/error-handler.ts` — criado: handler centralizado que nunca expõe stack trace em produção; diferencia erros de validação (400), erros HTTP conhecidos (<500) e erros internos (500)
- `src/server.ts` — atualizado para lidar com `buildApp()` assíncrono via `.then()`
- CORS aceita múltiplas origens via `CORS_ORIGIN` separado por vírgula
- Rate limit lê `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW` do `.env`

---

## 2026-05-06 — Estruturação inicial do Obsidian como base de documentação

**Contexto:** Projeto Engecon iniciado. Documentação existia em dois arquivos brutos no Obsidian (Escopo.md e banco de dados). Sem estrutura de navegação.

**Decisão:** Reorganizar o Obsidian como hub de documentação central, criar novos arquivos temáticos e adotar este arquivo como log de sessões.

**Motivo:** Facilitar navegação rápida do Claude entre sessões sem depender de contexto da conversa anterior.

**Impacto:** Criados os seguintes arquivos novos:
- `ÍNDICE.md` — hub de navegação principal
- `Banco de dados/Relacionamentos.md` — ERD, mapa de FKs, índices
- `Módulos/Módulos e Permissões.md` — matriz de permissões por perfil
- `Arquitetura/Stack e Arquitetura.md` — tech stack + segurança por camada
- `Cronograma/Fases.md` — 11 fases detalhadas

Arquivos existentes receberam frontmatter e wikilinks de navegação.
