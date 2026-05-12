---
title: Padrões de Desenvolvimento — Engecon
tags:
  - padrões
  - workflow
  - desenvolvimento
aliases:
  - padrões
  - workflow
  - como rodar
---

→ [[ÍNDICE]] | [[Stack e Arquitetura]]

# Padrões de Desenvolvimento

---

## Como Iniciar o Projeto

```bash
cd backend
npm install         # primeira vez
npm run dev         # servidor em http://localhost:3333
npm run db:seed     # popula banco com admin + dados de exemplo (idempotente)
npm run db:studio   # inspecionar banco via Prisma Studio
```

### Verificar se o servidor está no ar
```
GET http://localhost:3333/health
→ { "status": "ok" }
```

### Credenciais do admin (seed)
Definidas em `.env` via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Padrão do `.env.example`: `admin@engecon.com` / `Engecon@2026`.

---

## Fluxo de Migrations

> [!warning] Não usar `prisma migrate dev` diretamente
> O projeto usa migrations SQL manuais aplicadas no Supabase. Rodar `prisma migrate dev` pode conflitar com o banco existente.

### Como adicionar uma nova migration

1. Criar `prisma/migrations/<timestamp>_<nome>/migration.sql` com o SQL puro
2. Aplicar manualmente no Supabase (SQL Editor)
3. Registrar no Prisma como já aplicada:
   ```bash
   npx prisma migrate resolve --applied <timestamp>_<nome>
   ```
4. Adicionar script de conveniência em `package.json`:
   ```json
   "db:resolve:<n>": "prisma migrate resolve --applied <timestamp>_<nome>"
   ```
5. Atualizar `prisma/schema.prisma` para refletir as mudanças
6. Rodar `npm run db:generate` para regenerar o Prisma Client

### Migrations existentes

| Script | Migration | O que faz |
|---|---|---|
| `npm run db:resolve` | `20260507000000_initial` | Schema completo (todas as tabelas, enums, índices) |
| `npm run db:resolve:2` | `20260507000001_add_refresh_tokens` | Tabela `refresh_tokens` |
| `npm run db:resolve:3` | `20260509000000_add_ajuste_tipo_movimentacao` | Adiciona `ajuste` ao CHECK constraint de `movimentacoes.tipo` |

---

## Padrão de Módulo

Cada módulo vive em `src/modules/<nome>/` com três arquivos:

| Arquivo | Responsabilidade |
|---|---|
| `<nome>.schema.ts` | Schemas Zod — validação de input e tipagem de output |
| `<nome>.service.ts` | Lógica de negócio, queries Prisma, lança `AppError` para erros de domínio |
| `<nome>.routes.ts` | Rotas Fastify: aplica schema, autenticação, autorização e delega ao service |

### Exemplo — módulo `auth`
```
src/modules/auth/
├── auth.schema.ts   — loginSchema (Zod)
├── auth.service.ts  — loginService, refreshService, logoutService
└── auth.routes.ts   — POST /auth/login, /auth/refresh, /auth/logout
```

### Registrar o módulo em `src/app.ts`
```typescript
// Fases 4–7 — rotas dos módulos
await app.register(movimentacoesRoutes, { prefix: '/movimentacoes' })
await app.register(produtosRoutes,      { prefix: '/produtos' })
await app.register(estoqueRoutes,       { prefix: '/estoque' })
await app.register(colaboradoresRoutes, { prefix: '/colaboradores' })
await app.register(alocacoesRoutes,     { prefix: '/alocacoes' })
// próximos módulos seguem o mesmo padrão
```

### Imports padrão de um service
```typescript
import { prisma }    from '../../lib/prisma'
import { AppError }  from '../../lib/errors'
import { createLog } from '../../lib/log'
```

---

## Infraestrutura Base — já implementada (Fase 4)

> [!success] Estes dois itens existem no codebase desde a Fase 4

### 1. Decorator `authorize` — autorização por perfil

**Arquivo:** `src/app.ts` (junto ao decorator `authenticate`)

**O que faz:** recebe uma lista de perfis permitidos e rejeita com `403 Forbidden` se o perfil do usuário autenticado não estiver na lista.

**Diferença do `authenticate`:**
- `authenticate` — verifica se o token é válido (quem é você?)
- `authorize`    — verifica se o perfil tem permissão (o que você pode fazer?)

**Uso nas rotas:**
```typescript
preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])]
```

---

### 2. Helper `createLog` — auditoria de operações

**Arquivo:** `src/lib/log.ts`

**O que faz:** insere um registro na tabela `logs`. Aceita parâmetro `tx` opcional para chamada dentro de uma transação Prisma — garante que log e operação sejam atômicos.

**Quando usar:** em todo service que escreve no banco — create, update e soft-delete. Sempre chamar dentro da mesma transação da operação.

**Assinatura:**
```typescript
createLog({
  usuarioId:     string,
  acao:          string,          // 'criar' | 'editar' | 'inativar'
  tabelaAfetada: string,          // ex: 'movimentacoes'
  registroId?:   string,
  detalhe?:      Record<string, unknown>,
}, tx?)                           // tx = cliente de transação Prisma
```

**Uso em um service:**
```typescript
await prisma.$transaction(async (tx) => {
  const novo = await tx.produto.create({ data: { ... } })
  await createLog({ usuarioId, acao: 'criar', tabelaAfetada: 'produtos', registroId: novo.id }, tx)
  return novo
})
```

---

## Workflow do Frontend (Fase 9)

> [!warning] Peça o design antes de criar qualquer tela
> O projeto possui designs visuais de todas as telas. **Antes de implementar qualquer componente ou tela**, solicite ao usuário a referência visual correspondente.
> Nunca assuma o layout — trabalhe a partir do design fornecido.
