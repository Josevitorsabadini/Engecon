---
title: Cronograma de Fases — Engecon
tags:
  - cronograma
  - fases
aliases:
  - fases
  - cronograma
---

# Cronograma de Fases

→ [[ÍNDICE]] | [[Escopo]] | [[Stack e Arquitetura]]

**Total estimado: 22 a 33 dias de trabalho ativo**

## Tabela de Fases

| Fase | Nome | Duração estimada | Segurança incluída | Status |
|---|---|---|---|---|
| 0 | Arquitetura e Setup | 1–2 dias | Padrões, .env, estratégia de logs | ✅ Concluída |
| 1 | Ambiente de Desenvolvimento | 1–2 dias | Helmet, CORS, rate limiting, erros | ✅ Concluída |
| 2 | Autenticação | 1–2 dias | JWT, refresh token, brute-force | ✅ Concluída |
| 3 | Modelagem e criação do banco | 2–3 dias | Constraints, soft delete, índices, GENERATED | ✅ Concluída |
| 4 | Módulo: Movimentações | 3–4 dias | Zod, autorização, logs de operação | ✅ Concluída |
| 5 | Módulo: Produtos e Estoque | 2–3 dias | Zod, autorização, logs de operação | ✅ Concluída |
| 6 | Módulo: Colaboradores e Alocações | 2–3 dias | Zod, autorização, logs de operação | ✅ Concluída |
| 7 | Painel Admin: Fornecedores, Depósitos, Obras, Usuários | 2–3 dias | Zod, autorização, logs de operação | ✅ Concluída |
| 8 | Dashboard e Resumo Geral | 2 dias | Queries sem expor dados fora do perfil | ⏳ Em andamento |
| 9 | Frontend React Integrado | 5–10 dias | Rotas protegidas, httpOnly cookie | — |
| 10 | Testes e Preparação para Deploy | 2–3 dias | Pen test básico, hardening VPS | — |

---

## Detalhes por Fase

### Fase 0 — Arquitetura e Setup *(1–2 dias)*
Definição da estrutura de pastas, configuração do repositório, padrões de código, variáveis de ambiente e estratégia de logs.

### Fase 1 — Ambiente de Desenvolvimento *(1–2 dias)*
Configuração do servidor Fastify com Helmet, CORS restritivo, rate limiting global e estrutura centralizada de tratamento de erros.

### Fase 2 — Autenticação *(1–2 dias)*
Implementação de JWT com expiração curta, refresh token, bloqueio por brute-force e invalidação de token no logout.

### Fase 3 — Banco de Dados *(2–3 dias)*
Criação do schema PostgreSQL com todas as constraints, soft delete, índices e colunas geradas. Ver [[Banco.sql]] e [[Relacionamentos]].

### Fase 4 — Movimentações *(3–4 dias)*
Backend + API do módulo de movimentações. Módulo mais complexo do sistema — tabela central.

> [!success] Infraestrutura base criada nesta fase
> `authorize` (decorator em `src/app.ts`) e `createLog` (`src/lib/log.ts`) já existem. Ver detalhes em [[Padrões de Desenvolvimento]].

#### Regras de negócio — impacto no estoque

O estoque (`estoque`) é **global por produto** (não por localização). Ao salvar uma movimentação:

| Tipo | Efeito no estoque |
|---|---|
| `entrada` | `quantidade +=` · `valor_unitario` atualizado para o da movimentação |
| `saida` | `quantidade -=` · race condition evitado via `updateMany WHERE quantidade >= saida` |
| `transferencia` | quantidade não muda (a soma total é preservada) |
| `ajuste` | `quantidade` definida para valor absoluto · `valor_unitario` atualizado (ou mantido) · restrito a `administrador` |

`valor_total` é coluna gerada — nunca atualizar diretamente.

### Fase 5 — Produtos e Estoque *(2–3 dias)*
CRUD completo de produtos e leitura de estoque.

#### O que foi implementado
- `POST /produtos` — cria produto + registro de estoque com `quantidade=0` em transação única
- `GET /produtos`, `GET /produtos/:id` — leitor não vê `valorUnitario`
- `PATCH /produtos/:id` — atualiza nome, tipo, unidadeMedida, valorUnitario; `codigo` é **imutável**
- `DELETE /produtos/:id` — soft delete; se `codigo` pertence a produto inativo, mensagem orienta reativação
- `GET /estoque`, `GET /estoque/:produtoId` — leitor não vê `quantidade`, `valorUnitario`, `valorTotal`

#### Decisão: estoque inicial
Ao criar um produto, cria-se automaticamente um registro em `estoque` com `quantidade=0`. Assim todos os produtos aparecem na listagem de estoque desde o cadastro, sem depender de uma primeira entrada.

### Fase 6 — Colaboradores e Alocações *(2–3 dias)*
CRUD de colaboradores + gerenciamento de alocações por obra e período.

#### Endpoints esperados

**Colaboradores** (`/colaboradores`)
- `POST /` — editor, admin: cria colaborador; `cpf` opcional mas único quando presente
- `GET /` — todos: leitor não vê `valorDiaria`; suporte a filtro por `status` e `search` (nome/cpf)
- `GET /:id` — todos: leitor não vê `valorDiaria`; inclui alocações ativas
- `PATCH /:id` — editor, admin: atualiza campos (exceto cpf se já definido? A definir)
- `DELETE /:id` — editor, admin: soft delete (status → `inativo` + `deletedAt`)

**Alocações** (`/colaboradores/:id/alocacoes` ou `/alocacoes`)
- `POST /` — editor, admin: aloca colaborador em obra com `dataInicio`; `dataFim` opcional
- `GET /` — todos: lista alocações (filtro por obra, colaborador, período)
- `PATCH /:id` — editor, admin: atualiza `dataFim` para encerrar alocação
- `DELETE /:id` — admin: hard delete (sem `deletedAt` em `Alocacao`)

#### Regras de negócio
- `Colaborador.usuarioId` — vínculo opcional com uma conta de usuário do sistema
- `Alocacao` **não tem soft delete** — `deletedAt` não existe no schema; deleção é permanente
- `valorDiaria` é campo numérico — invisível para `leitor`
- Sem restrição de sobreposição de datas no banco — dois alocações do mesmo colaborador podem se sobrepor

### Fase 7 — Painel Administrativo *(2–3 dias)*
CRUD de fornecedores, depósitos, obras e usuários. Acesso restrito ao perfil `administrador`.

#### O que foi implementado

**Fornecedores** (`/fornecedores`)
- `POST /` — cria fornecedor; `cnpjCpf` opcional mas único quando presente; fornecedor inativo com mesmo CNPJ/CPF → mensagem orienta reativação
- `GET /` — paginado; `search` busca em nome e cnpjCpf
- `GET /:id` — busca por id (sem soft-deleted)
- `PATCH /:id` — atualiza qualquer campo; conflito de `cnpjCpf` verificado apenas se o novo valor difere do atual
- `DELETE /:id` — soft delete (`deletedAt`)

**Depósitos** (`/depositos`)
- `POST /` — cria depósito (nome obrigatório, descrição opcional)
- `GET /` — paginado; `search` busca em nome
- `GET /:id` — busca por id
- `PATCH /:id` — atualiza nome e/ou descrição
- `DELETE /:id` — soft delete

**Obras** (`/obras`)
- `POST /` — cria obra; datas validadas como string YYYY-MM-DD; `status` default `ativa`
- `GET /` — paginado; filtro por `status`; `search` busca em nome
- `GET /:id` — inclui alocações ativas (`dataFim IS NULL OR dataFim >= hoje`) com nome e cargo do colaborador
- `PATCH /:id` — atualização parcial via conditional spread
- `DELETE /:id` — soft delete

**Usuários** (`/usuarios`)
- `POST /` — cria usuário; senha hasheada (bcrypt 10 rounds); email único; conta inativa com mesmo e-mail → mensagem orienta reativação; retorna sem `senhaHash`
- `GET /` — paginado; filtro por `perfil`; `search` busca em nome e email; retorna sem `senhaHash`
- `GET /:id` — retorna sem `senhaHash`
- `PATCH /:id` — atualiza nome, perfil, ativo, senha; hash calculado fora da transação; retorna sem `senhaHash`
- `DELETE /:id` — soft delete; define `ativo: false` além de `deletedAt`

#### Regras de negócio

**Autorização**
Todos os endpoints dos quatro módulos exigem `administrador`. Nenhuma granularidade por perfil dentro da Fase 7 — painel admin é acesso integral ou nenhum.

**Obras — datas**
Datas (`dataInicio`, `dataPrevisaoFim`, `dataFim`) trafegam como string YYYY-MM-DD na API. Zod valida com regex; `toDate()` converte para `Date` antes do Prisma. "Hoje" para filtro de alocações ativas é calculado com `setHours(0, 0, 0, 0)` para comparação por dia inteiro.

**Usuários — proteções de integridade**

| Regra | Operação bloqueada | Código |
|---|---|---|
| Não excluir a si mesmo | `DELETE /:id` onde `id === solicitanteId` | 403 |
| Não desativar a si mesmo | `PATCH /:id { ativo: false }` onde `id === solicitanteId` | 403 |
| Não rebaixar o próprio perfil | `PATCH /:id { perfil: 'leitor'\|'editor' }` onde `id === solicitanteId` | 403 |
| Último administrador | Qualquer PATCH ou DELETE que tornaria `administradores ativos = 0` | 403 |

**Usuários — segurança de dados**
- `senhaHash` nunca retornada — constante `SELECT_SEM_SENHA` (`as const`) usada em todas as queries de leitura da tabela
- `bcrypt.hash` calculado **antes** do `prisma.$transaction` — operação CPU-bound; não deve segurar conexão do pool

### Fase 8 — Dashboard e Resumo Geral *(2 dias)*
Queries agregadas para KPIs — devem respeitar o perfil do usuário (sem expor dados além do permitido).

### Fase 9 — Frontend React Integrado *(5–10 dias)*
Integração completa do React com a API. Proteção de rotas por perfil, httpOnly cookie para token, sanitização de inputs.

### Fase 10 — Testes e Deploy *(2–3 dias)*
Testes de regressão, testes básicos de penetração (rotas sem token, com token expirado, com perfil errado), checklist de hardening para VPS.
