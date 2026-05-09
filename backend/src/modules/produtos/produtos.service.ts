import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarProdutoInput, AtualizarProdutoInput, ListarProdutosQuery } from './produtos.schema'

export async function criarProdutoService(data: CriarProdutoInput, usuarioId: string) {
  const existente = await prisma.produto.findFirst({ where: { codigo: data.codigo } })
  if (existente) {
    const msg = existente.deletedAt
      ? 'Este código pertence a um produto inativo. Contate o administrador para reativação.'
      : 'Já existe um produto com este código.'
    throw new AppError(msg, 409)
  }

  const produto = await prisma.$transaction(async (tx) => {
    const novo = await tx.produto.create({
      data: {
        codigo:        data.codigo,
        nome:          data.nome,
        tipo:          data.tipo,
        unidadeMedida: data.unidadeMedida,
        valorUnitario: data.valorUnitario,
      },
    })

    await tx.estoque.create({
      data: {
        produtoId:     novo.id,
        quantidade:    0,
        valorUnitario: data.valorUnitario,
        atualizadoPor: usuarioId,
      },
    })

    await createLog({ usuarioId, acao: 'criar', tabelaAfetada: 'produtos', registroId: novo.id }, tx)

    return novo
  })

  return produto
}

export async function listarProdutosService(query: ListarProdutosQuery) {
  const { search, tipo, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    ...(tipo && { tipo }),
    ...(search && {
      OR: [
        { nome:   { contains: search, mode: 'insensitive' as const } },
        { codigo: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, items] = await Promise.all([
    prisma.produto.count({ where }),
    prisma.produto.findMany({ where, skip, take: pageSize, orderBy: { nome: 'asc' } }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarProdutoService(id: string) {
  const produto = await prisma.produto.findFirst({
    where: { id, deletedAt: null },
    include: {
      estoque: {
        select: {
          id: true, quantidade: true, valorUnitario: true,
          valorTotal: true, atualizadoPor: true, updatedAt: true,
        },
      },
    },
  })
  if (!produto) throw new AppError('Produto não encontrado.', 404)
  return produto
}

export async function atualizarProdutoService(id: string, data: AtualizarProdutoInput, usuarioId: string) {
  const produto = await prisma.produto.findFirst({ where: { id, deletedAt: null } })
  if (!produto) throw new AppError('Produto não encontrado.', 404)

  const atualizado = await prisma.$transaction(async (tx) => {
    const result = await tx.produto.update({
      where: { id },
      data: {
        nome:          data.nome,
        tipo:          data.tipo,
        unidadeMedida: data.unidadeMedida,
        valorUnitario: data.valorUnitario,
      },
    })

    await createLog({
      usuarioId,
      acao:          'editar',
      tabelaAfetada: 'produtos',
      registroId:    id,
      detalhe:       data as Record<string, unknown>,
    }, tx)

    return result
  })

  return atualizado
}

export async function inativarProdutoService(id: string, usuarioId: string) {
  const produto = await prisma.produto.findFirst({ where: { id, deletedAt: null } })
  if (!produto) throw new AppError('Produto não encontrado.', 404)

  await prisma.$transaction(async (tx) => {
    await tx.produto.update({ where: { id }, data: { deletedAt: new Date() } })
    await createLog({ usuarioId, acao: 'inativar', tabelaAfetada: 'produtos', registroId: id }, tx)
  })
}
