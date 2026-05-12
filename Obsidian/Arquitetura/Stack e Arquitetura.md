---
title: Stack e Arquitetura — Engecon
tags:
  - arquitetura
  - stack
  - segurança
aliases:
  - stack
  - tech stack
  - arquitetura
---

# Stack e Arquitetura

→ [[ÍNDICE]] | [[Escopo]]

## Stack Tecnológica

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 | — |
| Backend | Node.js + Fastify | — |
| Banco de dados | PostgreSQL via Supabase | Supabase = host only |
| ORM | Prisma | Confirmado e em uso desde a Fase 0 |
| Autenticação | JWT + refresh token (bcrypt, @fastify/jwt) | Implementado na Fase 2 |
| Hospedagem atual | Local (máquina do dev) | — |
| Hospedagem futura | VPS | Fora do escopo atual |

> [!warning] Supabase é apenas infraestrutura
> O projeto **não usa** Supabase Auth, RLS, nem o SDK do Supabase. Apenas o banco PostgreSQL hospedado lá.

---

## Segurança por Camada

### Banco de Dados
- Usuário de conexão com permissões mínimas
- String de conexão exclusivamente em variável de ambiente
- Queries via Prisma — sem SQL raw com input do usuário
- Constraints: `NOT NULL`, `UNIQUE`; campos de tipo/perfil/status usam **PostgreSQL enum types** (não VARCHAR + CHECK)
- Timestamps automáticos em todas as tabelas (`created_at`, `updated_at`)
- Soft delete (`deleted_at`) — sem exclusão permanente
- Colunas geradas pelo banco: `valor_total` em `estoque` e `movimentacoes`

### Backend (Fastify)
- Middleware de autenticação em **todas** as rotas
- Autorização por perfil em toda rota com permissão específica
- Validação de 100% dos inputs com **Zod**
- Rate limiting global e por rota sensível
- CORS restritivo
- Headers de segurança (**Helmet**)
- Logs de todas as operações críticas (quem, o quê, quando, em qual registro)
- Tratamento centralizado de erros — nenhum detalhe interno exposto ao cliente
- Variáveis de ambiente para tudo que é sensível — ausência de variável obrigatória causa **falha imediata na inicialização** (fail-fast; sem fallbacks hardcoded no código)

### Autenticação
- JWT com expiração curta + refresh token
- Bloqueio temporário após X tentativas de login falhas
- Logout invalida o token no servidor
- Todas as rotas testadas sem token, com token expirado e com perfil errado

### Frontend (React)
- Rotas protegidas por perfil (UX apenas — autorização real no backend)
- Token em **httpOnly cookie** (não em localStorage)
- Nenhuma lógica de autorização real no frontend
- Dados sensíveis nunca logados no console em produção
- Inputs sanitizados antes de enviar à API

---

## Segurança por Fase de Desenvolvimento

| Fase | O que é implementado |
|---|---|
| 0 | Padrões de segurança, variáveis de ambiente, estratégia de logs |
| 1 | Helmet, CORS, rate limiting base, estrutura de erros centralizada |
| 2 | JWT + refresh token, middleware de auth, brute-force, testes de token |
| 3 | Constraints no banco, tipos corretos, soft delete, índices, colunas geradas |
| 4–7 | Zod em todos os inputs, autorização por rota, log de cada operação |
| 8 | Queries agregadas sem expor dados além do perfil |
| 9 | Rotas protegidas no React, httpOnly cookie, sem dados sensíveis no cliente |
| 10 | Revisão geral, testes básicos de penetração, checklist de hardening para VPS |
