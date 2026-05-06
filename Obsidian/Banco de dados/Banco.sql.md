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

```sql
-- ─────────────────────────────────────────
-- ENGECON — Schema do banco de dados
-- PostgreSQL via Supabase
-- ─────────────────────────────────────────

-- USUÁRIOS
CREATE TABLE usuarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR NOT NULL,
  email       VARCHAR NOT NULL UNIQUE,
  senha_hash  VARCHAR NOT NULL,
  perfil      VARCHAR NOT NULL CHECK (perfil IN ('leitor', 'editor', 'administrador')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- COLABORADORES
CREATE TABLE colaboradores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         VARCHAR NOT NULL,
  cpf          VARCHAR UNIQUE,
  telefone     VARCHAR,
  cargo        VARCHAR NOT NULL,
  valor_diaria NUMERIC NOT NULL,
  status       VARCHAR NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'afastado')),
  usuario_id   UUID REFERENCES usuarios(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

-- FORNECEDORES
CREATE TABLE fornecedores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR NOT NULL,
  cnpj_cpf    VARCHAR UNIQUE,
  telefone    VARCHAR,
  email       VARCHAR,
  observacoes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- DEPÓSITOS
CREATE TABLE depositos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR NOT NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- OBRAS
CREATE TABLE obras (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                VARCHAR NOT NULL,
  endereco            VARCHAR,
  status              VARCHAR NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'encerrada')),
  data_inicio         DATE,
  data_previsao_fim   DATE,
  data_fim            DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

-- ALOCAÇÕES (colaborador ↔ obra)
CREATE TABLE alocacoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id   UUID NOT NULL REFERENCES colaboradores(id),
  obra_id          UUID NOT NULL REFERENCES obras(id),
  data_inicio      DATE NOT NULL,
  data_fim         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUTOS
CREATE TABLE produtos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          VARCHAR NOT NULL UNIQUE,
  nome            VARCHAR NOT NULL,
  tipo            VARCHAR,
  unidade_medida  VARCHAR NOT NULL,
  valor_unitario  NUMERIC NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- ESTOQUE
CREATE TABLE estoque (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id      UUID NOT NULL UNIQUE REFERENCES produtos(id),
  quantidade      NUMERIC NOT NULL DEFAULT 0,
  valor_unitario  NUMERIC NOT NULL,
  valor_total     NUMERIC GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  atualizado_por  UUID REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- MOVIMENTAÇÕES
CREATE TABLE movimentacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            VARCHAR NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia')),
  produto_id      UUID NOT NULL REFERENCES produtos(id),
  quantidade      NUMERIC NOT NULL,
  valor_unitario  NUMERIC NOT NULL,
  valor_total     NUMERIC GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  origem_tipo     VARCHAR CHECK (origem_tipo IN ('obra', 'fornecedor', 'deposito')),
  origem_id       UUID,
  destino_tipo    VARCHAR CHECK (destino_tipo IN ('obra', 'fornecedor', 'deposito')),
  destino_id      UUID,
  obra_id         UUID REFERENCES obras(id),
  fornecedor_id   UUID REFERENCES fornecedores(id),
  observacoes     TEXT,
  realizado_por   UUID NOT NULL REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- LOGS
CREATE TABLE logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID NOT NULL REFERENCES usuarios(id),
  acao             VARCHAR NOT NULL,
  tabela_afetada   VARCHAR NOT NULL,
  registro_id      UUID,
  detalhe          JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────

CREATE INDEX idx_colaboradores_usuario    ON colaboradores(usuario_id);
CREATE INDEX idx_alocacoes_colaborador    ON alocacoes(colaborador_id);
CREATE INDEX idx_alocacoes_obra           ON alocacoes(obra_id);
CREATE INDEX idx_estoque_produto          ON estoque(produto_id);
CREATE INDEX idx_movimentacoes_produto    ON movimentacoes(produto_id);
CREATE INDEX idx_movimentacoes_obra       ON movimentacoes(obra_id);
CREATE INDEX idx_movimentacoes_tipo       ON movimentacoes(tipo);
CREATE INDEX idx_movimentacoes_created    ON movimentacoes(created_at);
CREATE INDEX idx_movimentacoes_origem     ON movimentacoes(origem_tipo, origem_id);
CREATE INDEX idx_movimentacoes_destino    ON movimentacoes(destino_tipo, destino_id);
CREATE INDEX idx_logs_usuario             ON logs(usuario_id);
CREATE INDEX idx_logs_tabela              ON logs(tabela_afetada);
CREATE INDEX idx_logs_created             ON logs(created_at);
```