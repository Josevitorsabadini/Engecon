---
title: Schema SQL — Engecon
tags:
  - banco-de-dados
  - sql
  - schema
aliases:
  - schema
  - banco sql
---

→ [[ÍNDICE]] | [[Documentação banco]] | [[Relacionamentos]]

> [!warning] Este é o schema real aplicado no banco
> O banco usa **PostgreSQL enum types** para todos os campos de tipo/perfil/status — não VARCHAR + CHECK.
> Fonte de verdade: `prisma/migrations/20260507000000_initial/migration.sql`

```sql
-- ─────────────────────────────────────────
-- ENGECON — Schema do banco de dados
-- PostgreSQL via Supabase
-- ─────────────────────────────────────────

-- ENUM TYPES
CREATE TYPE "Perfil"             AS ENUM ('leitor', 'editor', 'administrador');
CREATE TYPE "status_colaborador" AS ENUM ('ativo', 'inativo', 'afastado');
CREATE TYPE "status_obra"        AS ENUM ('ativa', 'pausada', 'encerrada');
CREATE TYPE "tipo_movimentacao"  AS ENUM ('entrada', 'saida', 'transferencia', 'ajuste');
CREATE TYPE "tipo_entidade"      AS ENUM ('obra', 'fornecedor', 'deposito');

-- USUÁRIOS
CREATE TABLE "usuarios" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome"       VARCHAR NOT NULL,
  "email"      VARCHAR NOT NULL UNIQUE,
  "senha_hash" VARCHAR NOT NULL,
  "perfil"     "Perfil" NOT NULL,
  "ativo"      BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMPTZ(6)
);

-- COLABORADORES
CREATE TABLE "colaboradores" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome"         VARCHAR NOT NULL,
  "cpf"          VARCHAR UNIQUE,
  "telefone"     VARCHAR,
  "cargo"        VARCHAR NOT NULL,
  "valor_diaria" NUMERIC NOT NULL,
  "status"       "status_colaborador" NOT NULL DEFAULT 'ativo',
  "usuario_id"   UUID REFERENCES "usuarios"("id"),
  "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"   TIMESTAMPTZ(6)
);

-- FORNECEDORES
CREATE TABLE "fornecedores" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome"        VARCHAR NOT NULL,
  "cnpj_cpf"   VARCHAR UNIQUE,
  "telefone"    VARCHAR,
  "email"       VARCHAR,
  "observacoes" TEXT,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"  TIMESTAMPTZ(6)
);

-- DEPÓSITOS
CREATE TABLE "depositos" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome"        VARCHAR NOT NULL,
  "descricao"   TEXT,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"  TIMESTAMPTZ(6)
);

-- OBRAS
CREATE TABLE "obras" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome"              VARCHAR NOT NULL,
  "endereco"          VARCHAR,
  "status"            "status_obra" NOT NULL DEFAULT 'ativa',
  "data_inicio"       DATE,
  "data_previsao_fim" DATE,
  "data_fim"          DATE,
  "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"        TIMESTAMPTZ(6)
);

-- ALOCAÇÕES (colaborador ↔ obra) — sem soft delete
CREATE TABLE "alocacoes" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "colaborador_id" UUID NOT NULL REFERENCES "colaboradores"("id"),
  "obra_id"        UUID NOT NULL REFERENCES "obras"("id"),
  "data_inicio"    DATE NOT NULL,
  "data_fim"       DATE,
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- PRODUTOS
CREATE TABLE "produtos" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "codigo"         VARCHAR NOT NULL UNIQUE,
  "nome"           VARCHAR NOT NULL,
  "tipo"           VARCHAR,
  "unidade_medida" VARCHAR NOT NULL,
  "valor_unitario" NUMERIC NOT NULL,
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"     TIMESTAMPTZ(6)
);

-- ESTOQUE (1:1 com produtos)
CREATE TABLE "estoque" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "produto_id"     UUID NOT NULL UNIQUE REFERENCES "produtos"("id"),
  "quantidade"     NUMERIC NOT NULL DEFAULT 0,
  "valor_unitario" NUMERIC NOT NULL,
  "valor_total"    NUMERIC GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  "atualizado_por" UUID REFERENCES "usuarios"("id"),
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"     TIMESTAMPTZ(6)
);

-- MOVIMENTAÇÕES
CREATE TABLE "movimentacoes" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tipo"           "tipo_movimentacao" NOT NULL,
  "produto_id"     UUID NOT NULL REFERENCES "produtos"("id"),
  "quantidade"     NUMERIC NOT NULL,
  "valor_unitario" NUMERIC NOT NULL,
  "valor_total"    NUMERIC GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  "origem_tipo"    "tipo_entidade",
  "origem_id"      UUID,
  "destino_tipo"   "tipo_entidade",
  "destino_id"     UUID,
  "obra_id"        UUID REFERENCES "obras"("id"),
  "fornecedor_id"  UUID REFERENCES "fornecedores"("id"),
  "observacoes"    TEXT,
  "realizado_por"  UUID NOT NULL REFERENCES "usuarios"("id"),
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"     TIMESTAMPTZ(6)
);

-- LOGS
CREATE TABLE "logs" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuario_id"     UUID NOT NULL REFERENCES "usuarios"("id"),
  "acao"           VARCHAR NOT NULL,
  "tabela_afetada" VARCHAR NOT NULL,
  "registro_id"    UUID,
  "detalhe"        JSONB,
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────

CREATE INDEX "idx_colaboradores_usuario"  ON "colaboradores"("usuario_id");
CREATE INDEX "idx_alocacoes_colaborador"  ON "alocacoes"("colaborador_id");
CREATE INDEX "idx_alocacoes_obra"         ON "alocacoes"("obra_id");
CREATE INDEX "idx_estoque_produto"        ON "estoque"("produto_id");
CREATE INDEX "idx_movimentacoes_produto"  ON "movimentacoes"("produto_id");
CREATE INDEX "idx_movimentacoes_obra"     ON "movimentacoes"("obra_id");
CREATE INDEX "idx_movimentacoes_tipo"     ON "movimentacoes"("tipo");
CREATE INDEX "idx_movimentacoes_created"  ON "movimentacoes"("created_at");
CREATE INDEX "idx_movimentacoes_origem"   ON "movimentacoes"("origem_tipo", "origem_id");
CREATE INDEX "idx_movimentacoes_destino"  ON "movimentacoes"("destino_tipo", "destino_id");
CREATE INDEX "idx_logs_usuario"           ON "logs"("usuario_id");
CREATE INDEX "idx_logs_tabela"            ON "logs"("tabela_afetada");
CREATE INDEX "idx_logs_created"           ON "logs"("created_at");
```
