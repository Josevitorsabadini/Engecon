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
