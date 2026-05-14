import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarObraInput, AtualizarObraInput, ListarObrasQuery } from './obras.schema'

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined
}

export async function criarObraService(data: CriarObraInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const nova = await tx.obra.create({
      data: {
        nome:            data.nome,
        endereco:        data.endereco,
        status:          data.status,
        dataInicio:      toDate(data.dataInicio),
        dataPrevisaoFim: toDate(data.dataPrevisaoFim),
        dataFim:         toDate(data.dataFim),
      },
    })
    await createLog({ usuarioId, acao: 'criar', tabelaAfetada: 'obras', registroId: nova.id }, tx)
    return nova
  })
}

export async function listarObrasService(query: ListarObrasQuery) {
  const { search, status, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    ...(status && { status }),
    ...(search && { nome: { contains: search, mode: 'insensitive' as const } }),
  }

  const [total, items] = await Promise.all([
    prisma.obra.count({ where }),
    prisma.obra.findMany({ where, skip, take: pageSize, orderBy: { nome: 'asc' } }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarObraService(id: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const obra = await prisma.obra.findFirst({
    where: { id, deletedAt: null },
    include: {
      alocacoes: {
        where: { OR: [{ dataFim: null }, { dataFim: { gte: hoje } }] },
        include: {
          colaborador: { select: { id: true, nome: true, cargo: true } },
        },
      },
    },
  })
  if (!obra) throw new AppError('Obra não encontrada.', 404)
  return obra
}

export async function atualizarObraService(id: string, data: AtualizarObraInput, usuarioId: string) {
  const obra = await prisma.obra.findFirst({ where: { id, deletedAt: null } })
  if (!obra) throw new AppError('Obra não encontrada.', 404)

  return prisma.$transaction(async (tx) => {
    const atualizada = await tx.obra.update({
      where: { id },
      data: {
        ...(data.nome            !== undefined && { nome:            data.nome }),
        ...(data.endereco        !== undefined && { endereco:        data.endereco }),
        ...(data.status          !== undefined && { status:          data.status }),
        ...(data.dataInicio      !== undefined && { dataInicio:      toDate(data.dataInicio) }),
        ...(data.dataPrevisaoFim !== undefined && { dataPrevisaoFim: toDate(data.dataPrevisaoFim) }),
        ...(data.dataFim         !== undefined && { dataFim:         toDate(data.dataFim) }),
      },
    })
    await createLog({
      usuarioId,
      acao:          'editar',
      tabelaAfetada: 'obras',
      registroId:    id,
      detalhe:       data as Record<string, unknown>,
    }, tx)
    return atualizada
  })
}

export async function inativarObraService(id: string, usuarioId: string) {
  const obra = await prisma.obra.findFirst({ where: { id, deletedAt: null } })
  if (!obra) throw new AppError('Obra não encontrada.', 404)

  await prisma.$transaction(async (tx) => {
    await tx.obra.update({ where: { id }, data: { deletedAt: new Date() } })
    await createLog({ usuarioId, acao: 'inativar', tabelaAfetada: 'obras', registroId: id }, tx)
  })
}
