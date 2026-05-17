import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import type { ListarObrasKpisQuery } from './dashboard.schema'
import type { StatusObra } from '@prisma/client'

function inicioDoDia(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function inicioDoDiaAmanha(): Date {
  const d = inicioDoDia()
  d.setDate(d.getDate() + 1)
  return d
}

export async function listarObrasKpisService(query: ListarObrasKpisQuery) {
  const hoje  = inicioDoDia()
  const amanha = inicioDoDiaAmanha()

  const whereObra = {
    deletedAt: null as null,
    ...(query.status ? { status: query.status as StatusObra } : {}),
  }

  const [obras, pendentesGrupo, paraHojeGrupo, atrasadosGrupo, colaboradoresGrupo] = await Promise.all([
    prisma.obra.findMany({ where: whereObra, orderBy: { createdAt: 'desc' } }),

    // Todos os pedidos pendentes por obra
    prisma.movimentacao.groupBy({
      by:    ['obraId'],
      where: { status: 'pendente', deletedAt: null, obraId: { not: null } },
      _count: { id: true },
    }),

    // Pedidos com data_necessidade = hoje
    prisma.movimentacao.groupBy({
      by:    ['obraId'],
      where: { status: 'pendente', dataNecessidade: { gte: hoje, lt: amanha }, deletedAt: null, obraId: { not: null } },
      _count: { id: true },
    }),

    // Pedidos com data_necessidade vencida (atrasados)
    prisma.movimentacao.groupBy({
      by:    ['obraId'],
      where: { status: 'pendente', dataNecessidade: { lt: hoje }, deletedAt: null, obraId: { not: null } },
      _count: { id: true },
    }),

    // Colaboradores ativos (alocações em aberto ou com dataFim >= hoje)
    prisma.alocacao.groupBy({
      by:    ['obraId'],
      where: { OR: [{ dataFim: null }, { dataFim: { gte: hoje } }] },
      _count: { id: true },
    }),
  ])

  const toMap = (arr: { obraId: string | null; _count: { id: number } }[]) =>
    new Map(arr.filter(x => x.obraId).map(x => [x.obraId!, x._count.id]))

  const pendentesMap    = toMap(pendentesGrupo)
  const paraHojeMap     = toMap(paraHojeGrupo)
  const atrasadosMap    = toMap(atrasadosGrupo)
  const colaboradoresMap = toMap(colaboradoresGrupo)

  return obras.map(obra => ({
    id:       obra.id,
    nome:     obra.nome,
    endereco: obra.endereco,
    status:   obra.status,
    kpis: {
      pendentes:     pendentesMap.get(obra.id)     ?? 0,
      paraHoje:      paraHojeMap.get(obra.id)      ?? 0,
      atrasados:     atrasadosMap.get(obra.id)     ?? 0,
      colaboradores: colaboradoresMap.get(obra.id) ?? 0,
    },
  }))
}

export async function kpisObraService(obraId: string) {
  const obra = await prisma.obra.findFirst({ where: { id: obraId, deletedAt: null } })
  if (!obra) throw new AppError('Obra não encontrada.', 404)

  const hoje   = inicioDoDia()
  const amanha = inicioDoDiaAmanha()

  const [pendentes, paraHoje, atrasados, colaboradores] = await Promise.all([
    prisma.movimentacao.count({
      where: { obraId, status: 'pendente', deletedAt: null },
    }),
    prisma.movimentacao.count({
      where: { obraId, status: 'pendente', dataNecessidade: { gte: hoje, lt: amanha }, deletedAt: null },
    }),
    prisma.movimentacao.count({
      where: { obraId, status: 'pendente', dataNecessidade: { lt: hoje }, deletedAt: null },
    }),
    prisma.alocacao.count({
      where: { obraId, OR: [{ dataFim: null }, { dataFim: { gte: hoje } }] },
    }),
  ])

  return {
    id:       obra.id,
    nome:     obra.nome,
    endereco: obra.endereco,
    status:   obra.status,
    kpis:     { pendentes, paraHoje, atrasados, colaboradores },
  }
}
