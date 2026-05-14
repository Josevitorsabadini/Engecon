import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarDepositoInput, AtualizarDepositoInput, ListarDepositosQuery } from './depositos.schema'

export async function criarDepositoService(data: CriarDepositoInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const novo = await tx.deposito.create({
      data: { nome: data.nome, descricao: data.descricao },
    })
    await createLog({ usuarioId, acao: 'criar', tabelaAfetada: 'depositos', registroId: novo.id }, tx)
    return novo
  })
}

export async function listarDepositosService(query: ListarDepositosQuery) {
  const { search, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    ...(search && { nome: { contains: search, mode: 'insensitive' as const } }),
  }

  const [total, items] = await Promise.all([
    prisma.deposito.count({ where }),
    prisma.deposito.findMany({ where, skip, take: pageSize, orderBy: { nome: 'asc' } }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarDepositoService(id: string) {
  const deposito = await prisma.deposito.findFirst({ where: { id, deletedAt: null } })
  if (!deposito) throw new AppError('Depósito não encontrado.', 404)
  return deposito
}

export async function atualizarDepositoService(id: string, data: AtualizarDepositoInput, usuarioId: string) {
  const deposito = await prisma.deposito.findFirst({ where: { id, deletedAt: null } })
  if (!deposito) throw new AppError('Depósito não encontrado.', 404)

  return prisma.$transaction(async (tx) => {
    const atualizado = await tx.deposito.update({
      where: { id },
      data: { nome: data.nome, descricao: data.descricao },
    })
    await createLog({
      usuarioId,
      acao:          'editar',
      tabelaAfetada: 'depositos',
      registroId:    id,
      detalhe:       data as Record<string, unknown>,
    }, tx)
    return atualizado
  })
}

export async function inativarDepositoService(id: string, usuarioId: string) {
  const deposito = await prisma.deposito.findFirst({ where: { id, deletedAt: null } })
  if (!deposito) throw new AppError('Depósito não encontrado.', 404)

  await prisma.$transaction(async (tx) => {
    await tx.deposito.update({ where: { id }, data: { deletedAt: new Date() } })
    await createLog({ usuarioId, acao: 'inativar', tabelaAfetada: 'depositos', registroId: id }, tx)
  })
}
