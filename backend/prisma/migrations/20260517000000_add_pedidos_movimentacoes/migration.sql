-- Fase 8 — Pedidos pendentes em movimentações
-- Adiciona status (confirmada | pendente) e data_necessidade à tabela movimentacoes

CREATE TYPE "status_movimentacao" AS ENUM ('confirmada', 'pendente');

ALTER TABLE "movimentacoes"
  ADD COLUMN "status"            "status_movimentacao" NOT NULL DEFAULT 'confirmada',
  ADD COLUMN "data_necessidade"  DATE;

CREATE INDEX "idx_movimentacoes_status"   ON "movimentacoes"("status");
CREATE INDEX "idx_movimentacoes_obra_kpi" ON "movimentacoes"("obra_id", "status", "data_necessidade");
