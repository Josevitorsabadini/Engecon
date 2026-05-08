---
title: Escopo — Engecon v3.0
tags:
  - escopo
  - visão-geral
aliases:
  - escopo do projeto
---

→ [[ÍNDICE]] | [[Stack e Arquitetura]] | [[Módulos e Permissões]] | [[Fases]]

# ENGECON — Sistema de Gestão Interna
Escopo v3.0

Stack tecnológica confirmada:

Frontend: React 18 + Vite + Tailwind CSS v3
Backend: Node.js + Fastify
Banco de dados: PostgreSQL via Supabase (apenas como host do banco — sem Supabase Auth, sem RLS, sem SDK do Supabase no projeto)
ORM: Prisma (a confirmar na Fase 0)
Autenticação: JWT (30min) + refresh token (UUID opaco, httpOnly cookie) + brute-force. Implementado do zero na Fase 2
Hospedagem inicial: local (máquina do dev)
Hospedagem futura: VPS — fora do escopo atual


Módulos confirmados:

Portal de Login — autenticação, redirecionamento por perfil
Dashboard Principal — navegação central, visão geral do sistema
Resumo Geral — KPIs consolidados de movimentações, estoque e obras
Movimentações — registro de entradas, saídas e transferências de materiais com produto, quantidade, valor unitário, valor total, origem e destino
Produtos — catálogo de materiais: cadastro, edição e inativação de produtos com código, tipo, unidade de medida e valor unitário de referência
Estoque — posição atual de cada produto: quantidade disponível, valor unitário e valor total calculado automaticamente
Colaboradores — cadastro de colaboradores com nome, CPF, telefone, cargo, valor de diária e status. Inclui alocação a obras com data de início, data de fim e obra de destino
Configurações — restrito ao Administrador. Inclui painel administrativo com gerenciamento de fornecedores, depósitos, obras e usuários do sistema


Perfis de acesso:

Leitor — acesso de leitura geral ao sistema, sem acesso a nenhum dado numérico (valores, quantidades, diárias, totais). Sem escrita em qualquer módulo
Editor — leitura total de todos os dados. Escrita em Movimentações, Estoque, Produtos e Colaboradores. Sem acesso ao painel administrativo
Administrador — acesso total ao sistema. Tudo do Editor mais acesso ao painel de Configurações: cadastro e edição de fornecedores, depósitos, obras e usuários


Banco de dados — entidades confirmadas:

usuarios — acesso ao sistema
colaboradores — pessoas que trabalham nas obras, com vínculo opcional a um usuário
alocacoes — vínculo entre colaborador e obra, com período de alocação
fornecedores — empresas ou pessoas físicas que fornecem materiais
depositos — pontos físicos de armazenamento da Engecon, usados como origem/destino em movimentações
obras — obras gerenciadas pela Engecon
produtos — catálogo de materiais
estoque — posição atual por produto, valor total calculado automaticamente pelo banco
movimentacoes — entradas, saídas e transferências, com origem e destino tipados (obra, fornecedor, depósito)
logs — auditoria interna de todas as ações críticas


Segurança e validações — por camada
Banco de dados:

Usuário de conexão com permissões mínimas
String de conexão exclusivamente em variável de ambiente
Queries via Prisma (sem SQL raw com input do usuário)
Constraints no banco: NOT NULL, UNIQUE, CHECK em campos de tipo e perfil
Timestamps automáticos em todas as tabelas (created_at, updated_at)
Soft delete (deleted_at) em vez de exclusão permanente
Colunas geradas pelo banco: valor_total em estoque e movimentações

Backend (Fastify):

Middleware de autenticação em todas as rotas
Autorização por perfil em toda rota que exige permissão específica
Validação de 100% dos inputs com Zod
Rate limiting global e por rota sensível
CORS restritivo
Headers de segurança (Helmet)
Logs de todas as operações críticas (quem, o quê, quando, em qual registro)
Tratamento centralizado de erros — nenhum detalhe interno exposto ao cliente
Variáveis de ambiente para tudo que é sensível

Autenticação:

JWT com expiração curta + refresh token
Bloqueio temporário após X tentativas de login falhas
Logout invalida o token no servidor
Todas as rotas testadas sem token, com token expirado e com perfil errado

Frontend (React):

Rotas protegidas por perfil
Token em httpOnly cookie (não em localStorage)
Nenhuma lógica de autorização real no frontend — o backend sempre rejeita
Dados sensíveis nunca logados no console em produção
Inputs sanitizados antes de enviar à API


Segurança por fase:

Fase 0: padrões de segurança, variáveis de ambiente, estratégia de logs
Fase 1: Helmet, CORS, rate limiting base, estrutura de erros centralizada
Fase 2: JWT + refresh token, middleware de auth, brute-force, testes de token
Fase 3: constraints no banco, tipos corretos, soft delete, índices, colunas geradas
Fases 4–7: Zod em todos os inputs, autorização por rota, log de cada operação
Fase 8: queries agregadas sem expor dados além do perfil
Fase 9: rotas protegidas no React, httpOnly cookie, sem dados sensíveis no cliente
Fase 10: revisão geral, testes básicos de penetração, checklist de hardening para VPS


Cronograma previsto:

Fase 0 — Arquitetura e Setup (1–2 dias)
Fase 1 — Ambiente de Desenvolvimento (1–2 dias)
Fase 2 — Autenticação (1–2 dias)
Fase 3 — Modelagem e criação do banco de dados (2–3 dias)
Fase 4 — Módulo: Movimentações (3–4 dias)
Fase 5 — Módulo: Produtos e Estoque (2–3 dias)
Fase 6 — Módulo: Colaboradores e Alocações (2–3 dias)
Fase 7 — Painel Administrativo: Fornecedores, Depósitos, Obras e Usuários (2–3 dias)
Fase 8 — Dashboard e Resumo Geral (2 dias)
Fase 9 — Frontend React Integrado (5–10 dias)
Fase 10 — Testes e Preparação para Deploy (2–3 dias)

Total estimado: 22 a 33 dias de trabalho ativo.