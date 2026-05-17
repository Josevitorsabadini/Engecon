import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarMovimentacaoInput, ListarMovimentacoesQuery } from './movimentacoes.schema'

const INCLUDE_MOVIMENTACAO = {
  produto:    { select: { id: true, codigo: true, nome: true, unidadeMedida: true } },
  obra:       { select: { id: true, nome: true } },
  fornecedor: { select: { id: true, nome: true } },
  usuario:    { select: { id: true, nome: true } },
} as const

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined
}

export async function criarMovimentacaoService(data: CriarMovimentacaoInput, usuarioId: string) {
  const produto = await prisma.produto.findFirst({
    where: { id: data.produtoId, deletedAt: null },
  })
  if (!produto) throw new AppError('Produto não encontrado.', 404)

  // Pedido pendente — não toca o estoque, só registra
  if (data.status === 'pendente') {
    const pedido = await prisma.$transaction(async (tx) => {
      const novo = await tx.movimentacao.create({
        data: {
          tipo:            'saida',
          status:          'pendente',
          produtoId:       data.produtoId,
          quantidade:      data.quantidade,
          valorUnitario:   data.valorUnitario!,
          obraId:          data.obraId,
          dataNecessidade: toDate(data.dataNecessidade),
          observacoes:     data.observacoes,
          realizadoPor:    usuarioId,
        },
        include: INCLUDE_MOVIMENTACAO,
      })

      await createLog(
        {
          usuarioId,
          acao:          'criar',
          tabelaAfetada: 'movimentacoes',
          registroId:    novo.id,
          detalhe:       { tipo: 'saida', status: 'pendente', produtoId: data.produtoId, quantidade: data.quantidade },
        },
        tx,
      )

      return novo
    })

    return pedido
  }

  // Movimentação imediata (confirmada) — lógica original preservada
  const movimentacao = await prisma.$transaction(async (tx) => {
    let valorUnitarioFinal = data.valorUnitario ?? 0

    if (data.tipo === 'entrada') {
      await tx.estoque.upsert({
        where: { produtoId: data.produtoId },
        create: {
          produtoId:     data.produtoId,
          quantidade:    data.quantidade,
          valorUnitario: data.valorUnitario!,
          atualizadoPor: usuarioId,
        },
        update: {
          quantidade:    { increment: data.quantidade },
          valorUnitario: data.valorUnitario!,
          atualizadoPor: usuarioId,
        },
      })
      valorUnitarioFinal = data.valorUnitario!
    }

    if (data.tipo === 'saida') {
      // WHERE com quantidade >= saida garante atomicidade contra race conditions
      const resultado = await tx.estoque.updateMany({
        where: {
          produtoId:  data.produtoId,
          quantidade: { gte: data.quantidade },
          deletedAt:  null,
        },
        data: {
          quantidade:    { decrement: data.quantidade },
          atualizadoPor: usuarioId,
        },
      })
      if (resultado.count === 0) {
        throw new AppError('Estoque insuficiente para realizar a saída.', 409)
      }
      valorUnitarioFinal = data.valorUnitario!
    }

    if (data.tipo === 'transferencia') {
      valorUnitarioFinal = data.valorUnitario!
    }

    if (data.tipo === 'ajuste') {
      const estoqueAtual = await tx.estoque.findFirst({
        where: { produtoId: data.produtoId, deletedAt: null },
      })
      if (!estoqueAtual) throw new AppError('Produto não possui estoque registrado. Registre uma entrada primeiro.', 404)

      valorUnitarioFinal = data.valorUnitario ?? Number(estoqueAtual.valorUnitario)

      await tx.estoque.update({
        where: { id: estoqueAtual.id },
        data: {
          quantidade:    data.quantidade,
          valorUnitario: valorUnitarioFinal,
          atualizadoPor: usuarioId,
        },
      })
    }

    const nova = await tx.movimentacao.create({
      data: {
        tipo:          data.tipo,
        status:        'confirmada',
        produtoId:     data.produtoId,
        quantidade:    data.quantidade,
        valorUnitario: valorUnitarioFinal,
        origemTipo:    data.origemTipo,
        origemId:      data.origemId,
        destinoTipo:   data.destinoTipo,
        destinoId:     data.destinoId,
        obraId:        data.obraId,
        fornecedorId:  data.fornecedorId,
        observacoes:   data.observacoes,
        realizadoPor:  usuarioId,
      },
      include: INCLUDE_MOVIMENTACAO,
    })

    await createLog(
      {
        usuarioId,
        acao:          'criar',
        tabelaAfetada: 'movimentacoes',
        registroId:    nova.id,
        detalhe:       { tipo: data.tipo, produtoId: data.produtoId, quantidade: data.quantidade },
      },
      tx,
    )

    return nova
  })

  return movimentacao
}

export async function confirmarPedidoService(id: string, usuarioId: string) {
  const pedido = await prisma.movimentacao.findFirst({
    where: { id, status: 'pendente', tipo: 'saida', deletedAt: null },
  })
  if (!pedido) throw new AppError('Pedido pendente não encontrado.', 404)

  await prisma.$transaction(async (tx) => {
    // Aplica a saída no estoque com proteção contra race condition
    const resultado = await tx.estoque.updateMany({
      where: {
        produtoId:  pedido.produtoId,
        quantidade: { gte: pedido.quantidade },
        deletedAt:  null,
      },
      data: {
        quantidade:    { decrement: pedido.quantidade },
        atualizadoPor: usuarioId,
      },
    })
    if (resultado.count === 0) {
      throw new AppError('Estoque insuficiente para confirmar a entrega.', 409)
    }

    // Lê o valorUnitario atual do estoque para registrar o preço real da saída
    const estoque = await tx.estoque.findFirst({
      where: { produtoId: pedido.produtoId, deletedAt: null },
    })

    await tx.movimentacao.update({
      where: { id },
      data: {
        status:        'confirmada',
        valorUnitario: estoque?.valorUnitario ?? pedido.valorUnitario,
      },
    })

    await createLog(
      {
        usuarioId,
        acao:          'confirmar',
        tabelaAfetada: 'movimentacoes',
        registroId:    id,
        detalhe:       { produtoId: pedido.produtoId, quantidade: pedido.quantidade.toString() },
      },
      tx,
    )
  })

  return prisma.movimentacao.findFirst({
    where: { id },
    include: INCLUDE_MOVIMENTACAO,
  })
}

export async function listarMovimentacoesService(query: ListarMovimentacoesQuery) {
  const { tipo, status, produtoId, obraId, dataInicio, dataFim, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    ...(tipo      && { tipo }),
    ...(status    && { status }),
    ...(produtoId && { produtoId }),
    ...(obraId    && { obraId }),
    ...(dataInicio || dataFim
      ? {
          createdAt: {
            ...(dataInicio && { gte: new Date(dataInicio) }),
            ...(dataFim    && { lte: new Date(dataFim) }),
          },
        }
      : {}),
  }

  const [total, items] = await Promise.all([
    prisma.movimentacao.count({ where }),
    prisma.movimentacao.findMany({
      where,
      skip,
      take:    pageSize,
      orderBy: { createdAt: 'desc' },
      include: INCLUDE_MOVIMENTACAO,
    }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarMovimentacaoService(id: string) {
  const movimentacao = await prisma.movimentacao.findFirst({
    where:   { id, deletedAt: null },
    include: INCLUDE_MOVIMENTACAO,
  })
  if (!movimentacao) throw new AppError('Movimentação não encontrada.', 404)
  return movimentacao
}
