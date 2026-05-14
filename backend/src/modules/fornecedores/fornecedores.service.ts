import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarFornecedorInput, AtualizarFornecedorInput, ListarFornecedoresQuery } from './fornecedores.schema'

export async function criarFornecedorService(data: CriarFornecedorInput, usuarioId: string) {
  if (data.cnpjCpf) {
    const existente = await prisma.fornecedor.findFirst({ where: { cnpjCpf: data.cnpjCpf } })
    if (existente) {
      const msg = existente.deletedAt
        ? 'Este CNPJ/CPF pertence a um fornecedor inativo. Contate o administrador para reativação.'
        : 'Já existe um fornecedor com este CNPJ/CPF.'
      throw new AppError(msg, 409)
    }
  }

  return prisma.$transaction(async (tx) => {
    const novo = await tx.fornecedor.create({
      data: {
        nome:        data.nome,
        cnpjCpf:     data.cnpjCpf,
        telefone:    data.telefone,
        email:       data.email,
        observacoes: data.observacoes,
      },
    })
    await createLog({ usuarioId, acao: 'criar', tabelaAfetada: 'fornecedores', registroId: novo.id }, tx)
    return novo
  })
}

export async function listarFornecedoresService(query: ListarFornecedoresQuery) {
  const { search, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    ...(search && {
      OR: [
        { nome:    { contains: search, mode: 'insensitive' as const } },
        { cnpjCpf: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, items] = await Promise.all([
    prisma.fornecedor.count({ where }),
    prisma.fornecedor.findMany({ where, skip, take: pageSize, orderBy: { nome: 'asc' } }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarFornecedorService(id: string) {
  const fornecedor = await prisma.fornecedor.findFirst({ where: { id, deletedAt: null } })
  if (!fornecedor) throw new AppError('Fornecedor não encontrado.', 404)
  return fornecedor
}

export async function atualizarFornecedorService(id: string, data: AtualizarFornecedorInput, usuarioId: string) {
  const fornecedor = await prisma.fornecedor.findFirst({ where: { id, deletedAt: null } })
  if (!fornecedor) throw new AppError('Fornecedor não encontrado.', 404)

  if (data.cnpjCpf && data.cnpjCpf !== fornecedor.cnpjCpf) {
    const conflito = await prisma.fornecedor.findFirst({ where: { cnpjCpf: data.cnpjCpf } })
    if (conflito) {
      const msg = conflito.deletedAt
        ? 'Este CNPJ/CPF pertence a um fornecedor inativo.'
        : 'Já existe um fornecedor com este CNPJ/CPF.'
      throw new AppError(msg, 409)
    }
  }

  return prisma.$transaction(async (tx) => {
    const atualizado = await tx.fornecedor.update({
      where: { id },
      data: {
        nome:        data.nome,
        cnpjCpf:     data.cnpjCpf,
        telefone:    data.telefone,
        email:       data.email,
        observacoes: data.observacoes,
      },
    })
    await createLog({
      usuarioId,
      acao:          'editar',
      tabelaAfetada: 'fornecedores',
      registroId:    id,
      detalhe:       data as Record<string, unknown>,
    }, tx)
    return atualizado
  })
}

export async function inativarFornecedorService(id: string, usuarioId: string) {
  const fornecedor = await prisma.fornecedor.findFirst({ where: { id, deletedAt: null } })
  if (!fornecedor) throw new AppError('Fornecedor não encontrado.', 404)

  await prisma.$transaction(async (tx) => {
    await tx.fornecedor.update({ where: { id }, data: { deletedAt: new Date() } })
    await createLog({ usuarioId, acao: 'inativar', tabelaAfetada: 'fornecedores', registroId: id }, tx)
  })
}
