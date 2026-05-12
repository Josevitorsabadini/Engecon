---
title: ÍNDICE — Engecon
tags:
  - índice
  - navegação
aliases:
  - hub
  - índice mestre
---

# ÍNDICE — Engecon

> [!abstract] Sistema de Gestão Interna
> Plataforma web para gestão de materiais, estoque, colaboradores e obras da Engecon.

## Documentação Principal

| Área | Arquivo | Descrição |
|---|---|---|
| Escopo | [[Escopo]] | Visão geral, módulos, perfis, cronograma |
| Stack | [[Stack e Arquitetura]] | Tech stack, camadas de segurança |
| Padrões | [[Padrões de Desenvolvimento]] | Como rodar, migrations, padrão de módulo, infraestrutura base |
| Banco — Entidades | [[Documentação banco]] | Descrição semântica de cada tabela |
| Banco — SQL | [[Banco.sql]] | Schema completo PostgreSQL |
| Banco — Relacionamentos | [[Relacionamentos]] | ERD, FKs, índices, colunas geradas |
| Módulos e Permissões | [[Módulos e Permissões]] | O que cada perfil pode ver e fazer |
| Cronograma | [[Fases]] | 11 fases de desenvolvimento |
| Log de Sessões | [[Decisões e Alterações]] | Decisões tomadas e mudanças de escopo |

---

## Visão Rápida

### Stack
`React 18` + `Vite` + `Tailwind v3` → `Node.js` + `Fastify` → `PostgreSQL` (host Supabase) + `Prisma`

### 10 Tabelas
`usuarios` · `colaboradores` · `alocacoes` · `fornecedores` · `depositos` · `obras` · `produtos` · `estoque` · `movimentacoes` · `logs`

### 3 Perfis de Acesso
`leitor` (leitura sem dados numéricos) · `editor` (leitura total + escrita operacional) · `administrador` (tudo + painel admin)

### 8 Módulos
Login · Dashboard · Resumo Geral · Movimentações · Produtos · Estoque · Colaboradores · Configurações

### Cronograma
11 fases — 22 a 33 dias de trabalho ativo → [[Fases]]

### Fase Atual
**Fase 7 — Painel Admin: Fornecedores, Depósitos, Obras, Usuários** · Fases 0–6 concluídas

---

## Alertas de Contexto

> [!warning] Supabase = apenas host
> Supabase é usado **somente como host do PostgreSQL**. Sem Auth, sem RLS, sem SDK do Supabase no código.

> [!info] Autenticação
> JWT com expiração curta (30min) + refresh token (UUID opaco, httpOnly cookie). Brute-force bloqueado após 5 tentativas. Implementado do zero — sem Supabase Auth, sem Resend.

> [!info] Hospedagem
> Ambiente atual: local (máquina do dev). VPS está **fora do escopo** desta versão.
