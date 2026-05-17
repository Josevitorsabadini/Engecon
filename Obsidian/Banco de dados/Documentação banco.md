---
title: Documentação do Banco — Engecon
tags:
  - banco-de-dados
  - entidades
aliases:
  - documentação banco
  - entidades
---

→ [[ÍNDICE]] | [[Banco.sql]] | [[Relacionamentos]]

# Documentação — Explicação de Cada Entidade

Usuários
Representa as pessoas que têm acesso ao sistema. Cada usuário possui um nome, e-mail de login, senha armazenada de forma criptografada e um perfil que define o que ele pode ver e fazer. Um usuário pode ser desativado sem ser excluído do sistema.

Colaboradores
Representa as pessoas que trabalham nas obras da Engecon. Nem todo colaborador precisa ter acesso ao sistema — o vínculo com um usuário é opcional. Cada colaborador tem um cargo, um valor de diária e um status que indica se está ativo, inativo ou afastado.

Fornecedores
Representa as empresas ou pessoas físicas que fornecem materiais para a Engecon. Armazena dados de contato e um campo de observações livre para anotações relevantes. Um fornecedor pode aparecer como origem em movimentações de entrada de materiais.

Depósitos
Representa os pontos físicos de armazenamento que pertencem à própria Engecon — como um almoxarifado central ou depósito de apoio. Serve como origem ou destino em movimentações, junto com obras e fornecedores.

Obras
Representa cada obra gerenciada pela Engecon. Possui nome, endereço, status (ativa, pausada ou encerrada) e datas de início, previsão de término e encerramento real. Uma obra pode receber colaboradores alocados e está vinculada a movimentações de materiais.

Alocações
Representa o vínculo entre um colaborador e uma obra. Registra em qual período o colaborador esteve trabalhando em determinada obra, com data de início e data de fim (em aberto enquanto a alocação estiver ativa). Um colaborador pode ter várias alocações ao longo do tempo, em obras diferentes ou até simultâneas.

Produtos
Representa o catálogo de materiais utilizados pela Engecon. Cada produto tem um código interno único, nome, tipo (categoria), unidade de medida e um valor unitário de referência. É a base para o estoque e para todas as movimentações.

Estoque
Representa a posição atual de cada produto no almoxarifado. Existe um único registro por produto, com a quantidade disponível e o valor unitário da última entrada. O valor total em estoque é calculado automaticamente pelo banco multiplicando quantidade por valor unitário — sem necessidade de cálculo manual.

Movimentações
Representa cada entrada, saída, transferência ou ajuste de estoque registrado no sistema, além de pedidos futuros de material. O campo `status` diferencia movimentações imediatas (`confirmada`, padrão) de pedidos pendentes (`pendente`). Um pedido pendente é sempre uma `saida` vinculada a uma obra com `data_necessidade` preenchida — o estoque só é debitado quando o pedido é confirmado via `PATCH /movimentacoes/:id/confirmar`. A urgência dos pedidos é derivada automaticamente da `data_necessidade`: anterior a hoje = atrasado, igual a hoje = para hoje. Armazena o produto, a quantidade, o valor unitário e o valor total (calculado automaticamente). Também registra origem e destino (obra, fornecedor ou depósito) e o usuário que realizou o registro. É a tabela central do sistema e a base para os KPIs do dashboard.

Logs
Registra automaticamente todas as ações relevantes feitas no sistema — criações, edições e exclusões. Armazena quem fez a ação, em qual tabela, em qual registro e um detalhe em formato livre com informações adicionais quando necessário. Existe exclusivamente para fins de auditoria interna.

Refresh Tokens
Armazena os tokens de renovação de sessão de cada usuário. Cada registro contém um UUID opaco (não um JWT assinado), o vínculo com o usuário, e uma data de expiração. Quando o usuário faz logout, o registro é deletado permanentemente. Não possui soft delete — a remoção é definitiva. Permite reemissão de access tokens sem necessidade de novo login enquanto a sessão estiver válida.