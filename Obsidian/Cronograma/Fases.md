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
| 6 | Módulo: Colaboradores e Alocações | 2–3 dias | Zod, autorização, logs de operação | ⏳ Em andamento |
| 7 | Painel Admin: Fornecedores, Depósitos, Obras, Usuários | 2–3 dias | Zod, autorização, logs de operação | — |
| 8 | Dashboard e Resumo Geral | 2 dias | Queries sem expor dados fora do perfil | — |
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
Backend + API do módulo de movimentações: entradas, saídas e transferências. Módulo mais complexo do sistema — tabela central.

> [!warning] Pré-requisitos — criar antes das rotas
> Os itens abaixo **não existem no codebase** e bloqueiam toda a Fase 4. Ver detalhes em [[Padrões de Desenvolvimento]].
> 1. **Decorator `authorize`** em `src/app.ts` — autorização por perfil (403 se perfil não permitido)
> 2. **Helper `createLog`** em `src/lib/log.ts` — insere registro na tabela `logs`

#### Regras de negócio — impacto no estoque

O estoque (`estoque`) é **global por produto** (não por localização). Ao salvar uma movimentação:

| Tipo | Efeito no estoque |
|---|---|
| `entrada` | `quantidade +=` · `valor_unitario` atualizado para o da movimentação |
| `saida` | `quantidade -=` · validar: quantidade não pode ficar negativa |
| `transferencia` | quantidade não muda (a soma total é preservada) |

`valor_total` é coluna gerada — nunca atualizar diretamente.

### Fase 5 — Produtos e Estoque *(2–3 dias)*
CRUD de produtos e lógica de atualização do estoque a cada movimentação.

### Fase 6 — Colaboradores e Alocações *(2–3 dias)*
CRUD de colaboradores + gerenciamento de alocações por obra e período.

### Fase 7 — Painel Administrativo *(2–3 dias)*
CRUD de fornecedores, depósitos, obras e usuários. Acesso restrito ao perfil `administrador`.

### Fase 8 — Dashboard e Resumo Geral *(2 dias)*
Queries agregadas para KPIs — devem respeitar o perfil do usuário (sem expor dados além do permitido).

### Fase 9 — Frontend React Integrado *(5–10 dias)*
Integração completa do React com a API. Proteção de rotas por perfil, httpOnly cookie para token, sanitização de inputs.

### Fase 10 — Testes e Deploy *(2–3 dias)*
Testes de regressão, testes básicos de penetração (rotas sem token, com token expirado, com perfil errado), checklist de hardening para VPS.
