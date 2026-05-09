-- Adiciona 'ajuste' ao CHECK constraint de tipo em movimentacoes
-- Necessário para suportar ajuste manual de estoque (correção de inventário)

ALTER TABLE movimentacoes DROP CONSTRAINT IF EXISTS movimentacoes_tipo_check;
ALTER TABLE movimentacoes
  ADD CONSTRAINT movimentacoes_tipo_check
  CHECK (tipo IN ('entrada', 'saida', 'transferencia', 'ajuste'));
