import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarAlocacaoInput, AtualizarAlocacaoInput, ListarAlocacoesQuery } from './alocacoes.schema'

export async function criarAlocacaoService(data: CriarAlocacaoInput, usuarioId: string) {
  const colaborador = await prisma.colaborador.findFirst({
    where: { id: data.colaboradorId, deletedAt: null },
  })
  if (!colaborador) throw new AppError('Colaborador não encontrado.', 404)
  if (colaborador.status !== 'ativo') throw new AppError('Colaborador não está ativo.', 422)

  const obra = await prisma.obra.findFirst({
    where: { id: data.obraId, deletedAt: null },
  })
  if (!obra) throw new AppError('Obra não encontrada.', 404)
  if (obra.status !== 'ativa') throw new AppError('Obra não está ativa.', 422)

  const alocacao = await prisma.$transaction(async (tx) => {
    const nova = await tx.alocacao.create({
      data: {
        colaboradorId: data.colaboradorId,
        obraId:        data.obraId,
        dataInicio:    new Date(data.dataInicio),
        dataFim:       data.dataFim ? new Date(data.dataFim) : null,
      },
      include: {
        colaborador: { select: { id: true, nome: true } },
        obra:        { select: { id: true, nome: true } },
      },
    })

    await createLog({ usuarioId, acao: 'criar', tabelaAfetada: 'alocacoes', registroId: nova.id }, tx)

    return nova
  })

  return alocacao
}

export async function listarAlocacoesService(query: ListarAlocacoesQuery) {
  const { colaboradorId, obraId, dataInicioFrom, dataInicioTo, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    ...(colaboradorId && { colaboradorId }),
    ...(obraId && { obraId }),
    ...((dataInicioFrom || dataInicioTo) && {
      dataInicio: {
        ...(dataInicioFrom && { gte: new Date(dataInicioFrom) }),
        ...(dataInicioTo   && { lte: new Date(dataInicioTo) }),
      },
    }),
  }

  const [total, items] = await Promise.all([
    prisma.alocacao.count({ where }),
    prisma.alocacao.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { dataInicio: 'desc' },
      include: {
        colaborador: { select: { id: true, nome: true, cargo: true } },
        obra:        { select: { id: true, nome: true, status: true } },
      },
    }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarAlocacaoService(id: string) {
  const alocacao = await prisma.alocacao.findFirst({
    where: { id },
    include: {
      colaborador: { select: { id: true, nome: true, cargo: true } },
      obra:        { select: { id: true, nome: true, status: true } },
    },
  })
  if (!alocacao) throw new AppError('Alocação não encontrada.', 404)
  return alocacao
}

export async function atualizarAlocacaoService(id: string, data: AtualizarAlocacaoInput, usuarioId: string) {
  const alocacao = await prisma.alocacao.findFirst({ where: { id } })
  if (!alocacao) throw new AppError('Alocação não encontrada.', 404)

  const novaDataFim = new Date(data.dataFim)
  if (novaDataFim < alocacao.dataInicio) {
    throw new AppError('dataFim não pode ser anterior a dataInicio da alocação.', 422)
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    const result = await tx.alocacao.update({
      where: { id },
      data: { dataFim: novaDataFim },
      include: {
        colaborador: { select: { id: true, nome: true } },
        obra:        { select: { id: true, nome: true } },
      },
    })

    await createLog({
      usuarioId,
      acao:          'editar',
      tabelaAfetada: 'alocacoes',
      registroId:    id,
      detalhe:       { dataFim: data.dataFim },
    }, tx)

    return result
  })

  return atualizado
}

export async function excluirAlocacaoService(id: string, usuarioId: string) {
  const alocacao = await prisma.alocacao.findFirst({ where: { id } })
  if (!alocacao) throw new AppError('Alocação não encontrada.', 404)

  await prisma.$transaction(async (tx) => {
    await tx.alocacao.delete({ where: { id } })
    await createLog({ usuarioId, acao: 'excluir', tabelaAfetada: 'alocacoes', registroId: id }, tx)
  })
}
