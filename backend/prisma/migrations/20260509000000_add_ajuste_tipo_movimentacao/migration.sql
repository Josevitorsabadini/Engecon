-- Adiciona 'ajuste' ao enum tipo_movimentacao
-- O banco usa PostgreSQL ENUM type, não VARCHAR + CHECK

ALTER TYPE "tipo_movimentacao" ADD VALUE IF NOT EXISTS 'ajuste';
