import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarMovimentacaoInput, ListarMovimentacoesQuery } from './movimentacoes.schema'

export async function criarMovimentacaoService(data: CriarMovimentacaoInput, usuarioId: string) {
  const produto = await prisma.produto.findFirst({
    where: { id: data.produtoId, deletedAt: null },
  })
  if (!produto) throw new AppError('Produto não encontrado.', 404)

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
          produtoId: data.produtoId,
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
      include: {
        produto:    { select: { id: true, codigo: true, nome: true, unidadeMedida: true } },
        obra:       { select: { id: true, nome: true } },
        fornecedor: { select: { id: true, nome: true } },
        usuario:    { select: { id: true, nome: true } },
      },
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

export async function listarMovimentacoesService(query: ListarMovimentacoesQuery) {
  const { tipo, produtoId, dataInicio, dataFim, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    ...(tipo      && { tipo }),
    ...(produtoId && { produtoId }),
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
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        produto:    { select: { id: true, codigo: true, nome: true, unidadeMedida: true } },
        obra:       { select: { id: true, nome: true } },
        fornecedor: { select: { id: true, nome: true } },
        usuario:    { select: { id: true, nome: true } },
      },
    }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarMovimentacaoService(id: string) {
  const movimentacao = await prisma.movimentacao.findFirst({
    where: { id, deletedAt: null },
    include: {
      produto:    { select: { id: true, codigo: true, nome: true, unidadeMedida: true } },
      obra:       { select: { id: true, nome: true } },
      fornecedor: { select: { id: true, nome: true } },
      usuario:    { select: { id: true, nome: true } },
    },
  })
  if (!movimentacao) throw new AppError('Movimentação não encontrada.', 404)
  return movimentacao
}
