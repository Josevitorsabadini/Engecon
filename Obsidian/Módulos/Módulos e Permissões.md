---
title: Módulos e Permissões — Engecon
tags:
  - módulos
  - permissões
  - perfis
aliases:
  - permissões
  - acesso
  - perfis de acesso
---

# Módulos e Permissões

→ [[ÍNDICE]] | [[Escopo]]

## Perfis de Acesso

| Perfil | Leitura | Dados Numéricos | Escrita Operacional | Painel Admin |
|---|---|---|---|---|
| `leitor` | Geral (sem números) | ✗ | ✗ | ✗ |
| `editor` | Total | ✓ | ✓ | ✗ |
| `administrador` | Total | ✓ | ✓ | ✓ |

> [!info] Dados numéricos bloqueados para o Leitor
> Valores, quantidades, diárias e totais são invisíveis para o perfil `leitor`.

---

## Matriz de Permissões por Módulo

| Módulo | Leitor | Editor | Administrador |
|---|---|---|---|
| Portal de Login | ✓ autenticação | ✓ autenticação | ✓ autenticação |
| Dashboard Principal | ✓ leitura (sem valores) | ✓ leitura total | ✓ leitura total |
| Dashboard — KPIs de obras | ✓ leitura (só contagens) | ✓ leitura total | ✓ leitura total |
| Movimentações | ✓ leitura (sem valores) | ✓ leitura + escrita + pedidos | ✓ leitura + escrita + pedidos |
| Produtos | ✓ leitura (sem valores) | ✓ leitura + escrita | ✓ leitura + escrita |
| Estoque | ✓ leitura (sem valores) | ✓ leitura + escrita | ✓ leitura + escrita |
| Colaboradores | ✓ leitura (sem diárias) | ✓ leitura + escrita | ✓ leitura + escrita |
| Configurações (Admin) | ✗ | ✗ | ✓ acesso total |

---

## Descrição dos Módulos

### Portal de Login
Autenticação do usuário com redirecionamento automático para a tela correta conforme o perfil.

### Dashboard Principal
Tela central de navegação. Ponto de entrada após o login — links para todos os módulos disponíveis ao perfil do usuário.

### Dashboard — KPIs de obras
Cards por obra com quatro KPIs: pedidos pendentes, pedidos para hoje, pedidos atrasados e colaboradores ativos. Os KPIs são contagens — sem valores monetários — e por isso acessíveis a todos os perfis incluindo `leitor`. Endpoints: `GET /dashboard/obras` e `GET /dashboard/obras/:id`.

### Movimentações
Registro de entradas, saídas, transferências e ajustes manuais de estoque. Inclui também **pedidos pendentes**: saídas futuras vinculadas a uma obra com `data_necessidade`. Editor e administrador criam e confirmam pedidos. Leitor vê a listagem (sem valores).
Campos: produto, quantidade, valor unitário, valor total (gerado), status (confirmada/pendente), data de necessidade, origem (obra/fornecedor/depósito), destino.

### Produtos
Catálogo de materiais: cadastro, edição e inativação.
Campos: código interno, nome, tipo/categoria, unidade de medida, valor unitário de referência.

### Estoque
Posição atual de cada produto: quantidade disponível, valor unitário e valor total calculado automaticamente.
Um registro por produto (1:1 com `produtos`).

### Colaboradores
Cadastro de pessoas que trabalham nas obras.
Campos: nome, CPF, telefone, cargo, valor de diária, status (ativo/inativo/afastado).
Inclui **alocação a obras** com data de início, data de fim e obra de destino.

### Configurações *(Administrador only)*
Painel administrativo com gerenciamento de:
- **Fornecedores** — empresas/PF que fornecem materiais
- **Depósitos** — pontos físicos de armazenamento da Engecon
- **Obras** — obras gerenciadas
- **Usuários** — contas de acesso ao sistema

---

## Regra de Autorização

> [!tip] Backend sempre rejeita — frontend não autoriza
> O frontend protege rotas por perfil apenas para UX. A autorização real acontece 100% no backend (Fastify). O frontend nunca é fonte de verdade sobre permissões.
