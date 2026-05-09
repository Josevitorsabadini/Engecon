import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import type { ListarEstoqueQuery } from './estoque.schema'

export async function listarEstoqueService(query: ListarEstoqueQuery) {
  const { search, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    produto: {
      deletedAt: null as null,
      ...(search && {
        OR: [
          { nome:   { contains: search, mode: 'insensitive' as const } },
          { codigo: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    },
  }

  const [total, items] = await Promise.all([
    prisma.estoque.count({ where }),
    prisma.estoque.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { produto: { nome: 'asc' } },
      include: {
        produto: { select: { id: true, codigo: true, nome: true, tipo: true, unidadeMedida: true } },
      },
    }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarEstoquePorProdutoService(produtoId: string) {
  const estoque = await prisma.estoque.findFirst({
    where: { produtoId, deletedAt: null },
    include: {
      produto: { select: { id: true, codigo: true, nome: true, tipo: true, unidadeMedida: true } },
    },
  })
  if (!estoque) throw new AppError('Produto não encontrado no estoque.', 404)
  return estoque
}
