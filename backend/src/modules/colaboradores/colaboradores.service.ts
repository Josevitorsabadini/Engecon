import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarColaboradorInput, AtualizarColaboradorInput, ListarColaboradoresQuery } from './colaboradores.schema'

export async function criarColaboradorService(data: CriarColaboradorInput, usuarioId: string) {
  if (data.cpf) {
    const existente = await prisma.colaborador.findFirst({ where: { cpf: data.cpf } })
    if (existente) {
      throw new AppError('Já existe um colaborador cadastrado com este CPF.', 409)
    }
  }

  if (data.usuarioId) {
    const usuario = await prisma.usuario.findFirst({ where: { id: data.usuarioId, deletedAt: null } })
    if (!usuario) throw new AppError('Usuário vinculado não encontrado.', 404)
  }

  const colaborador = await prisma.$transaction(async (tx) => {
    const novo = await tx.colaborador.create({
      data: {
        nome:        data.nome,
        cpf:         data.cpf,
        telefone:    data.telefone,
        cargo:       data.cargo,
        valorDiaria: data.valorDiaria,
        usuarioId:   data.usuarioId,
      },
    })

    await createLog({ usuarioId, acao: 'criar', tabelaAfetada: 'colaboradores', registroId: novo.id }, tx)

    return novo
  })

  return colaborador
}

export async function listarColaboradoresService(query: ListarColaboradoresQuery) {
  const { status, search, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    ...(status === 'inativo'
      ? { deletedAt: { not: null as null }, status: 'inativo' as const }
      : { deletedAt: null as null, ...(status && { status }) }
    ),
    ...(search && {
      OR: [
        { nome: { contains: search, mode: 'insensitive' as const } },
        { cpf:  { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, items] = await Promise.all([
    prisma.colaborador.count({ where }),
    prisma.colaborador.findMany({ where, skip, take: pageSize, orderBy: { nome: 'asc' } }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarColaboradorService(id: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const colaborador = await prisma.colaborador.findFirst({
    where: { id, deletedAt: null },
    include: {
      alocacoes: {
        where: {
          OR: [
            { dataFim: null },
            { dataFim: { gte: hoje } },
          ],
        },
        include: {
          obra: { select: { id: true, nome: true, status: true } },
        },
        orderBy: { dataInicio: 'desc' },
      },
    },
  })

  if (!colaborador) throw new AppError('Colaborador não encontrado.', 404)
  return colaborador
}

export async function atualizarColaboradorService(id: string, data: AtualizarColaboradorInput, usuarioId: string) {
  const colaborador = await prisma.colaborador.findFirst({ where: { id, deletedAt: null } })
  if (!colaborador) throw new AppError('Colaborador não encontrado.', 404)

  if (data.cpf) {
    if (colaborador.cpf) {
      throw new AppError('O CPF não pode ser alterado após ser definido.', 422)
    }
    const existente = await prisma.colaborador.findFirst({ where: { cpf: data.cpf } })
    if (existente) throw new AppError('Já existe um colaborador cadastrado com este CPF.', 409)
  }

  if (data.usuarioId) {
    const usuario = await prisma.usuario.findFirst({ where: { id: data.usuarioId, deletedAt: null } })
    if (!usuario) throw new AppError('Usuário vinculado não encontrado.', 404)
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    const result = await tx.colaborador.update({
      where: { id },
      data: {
        nome:        data.nome,
        cpf:         data.cpf,
        telefone:    data.telefone,
        cargo:       data.cargo,
        valorDiaria: data.valorDiaria,
        status:      data.status,
        usuarioId:   data.usuarioId,
      },
    })

    await createLog({
      usuarioId,
      acao:          'editar',
      tabelaAfetada: 'colaboradores',
      registroId:    id,
      detalhe:       data as Record<string, unknown>,
    }, tx)

    return result
  })

  return atualizado
}

export async function inativarColaboradorService(id: string, usuarioId: string) {
  const colaborador = await prisma.colaborador.findFirst({ where: { id, deletedAt: null } })
  if (!colaborador) throw new AppError('Colaborador não encontrado.', 404)

  await prisma.$transaction(async (tx) => {
    await tx.colaborador.update({
      where: { id },
      data: { status: 'inativo', deletedAt: new Date() },
    })
    await createLog({ usuarioId, acao: 'inativar', tabelaAfetada: 'colaboradores', registroId: id }, tx)
  })
}
