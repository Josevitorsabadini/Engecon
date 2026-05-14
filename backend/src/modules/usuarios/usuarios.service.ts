import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../lib/errors'
import { createLog } from '../../lib/log'
import type { CriarUsuarioInput, AtualizarUsuarioInput, ListarUsuariosQuery } from './usuarios.schema'

const BCRYPT_ROUNDS = 10

async function verificarUltimoAdmin(excluirId: string) {
  const count = await prisma.usuario.count({
    where: { perfil: 'administrador', ativo: true, deletedAt: null, id: { not: excluirId } },
  })
  if (count === 0) {
    throw new AppError('Não é possível remover ou rebaixar o único administrador ativo do sistema.', 403)
  }
}

const SELECT_SEM_SENHA = {
  id: true, nome: true, email: true, perfil: true,
  ativo: true, createdAt: true, updatedAt: true, deletedAt: true,
} as const

export async function criarUsuarioService(data: CriarUsuarioInput, solicitanteId: string) {
  const existente = await prisma.usuario.findFirst({ where: { email: data.email } })
  if (existente) {
    const msg = existente.deletedAt
      ? 'Este e-mail pertence a uma conta inativa. Contate o administrador para reativação.'
      : 'Já existe um usuário com este e-mail.'
    throw new AppError(msg, 409)
  }

  const senhaHash = await bcrypt.hash(data.senha, BCRYPT_ROUNDS)

  return prisma.$transaction(async (tx) => {
    const novo = await tx.usuario.create({
      data: { nome: data.nome, email: data.email, senhaHash, perfil: data.perfil },
      select: SELECT_SEM_SENHA,
    })
    await createLog({ usuarioId: solicitanteId, acao: 'criar', tabelaAfetada: 'usuarios', registroId: novo.id }, tx)
    return novo
  })
}

export async function listarUsuariosService(query: ListarUsuariosQuery) {
  const { search, perfil, page, pageSize } = query
  const skip = (page - 1) * pageSize

  const where = {
    deletedAt: null as null,
    ...(perfil && { perfil }),
    ...(search && {
      OR: [
        { nome:  { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, items] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({ where, skip, take: pageSize, orderBy: { nome: 'asc' }, select: SELECT_SEM_SENHA }),
  ])

  return { total, page, pageSize, items }
}

export async function buscarUsuarioService(id: string) {
  const usuario = await prisma.usuario.findFirst({
    where: { id, deletedAt: null },
    select: SELECT_SEM_SENHA,
  })
  if (!usuario) throw new AppError('Usuário não encontrado.', 404)
  return usuario
}

export async function atualizarUsuarioService(id: string, data: AtualizarUsuarioInput, solicitanteId: string) {
  const usuario = await prisma.usuario.findFirst({ where: { id, deletedAt: null } })
  if (!usuario) throw new AppError('Usuário não encontrado.', 404)

  if (id === solicitanteId && data.perfil !== undefined && data.perfil !== 'administrador') {
    throw new AppError('Você não pode alterar o próprio perfil.', 403)
  }

  if (id === solicitanteId && data.ativo === false) {
    throw new AppError('Você não pode desativar sua própria conta.', 403)
  }

  if (usuario.perfil === 'administrador') {
    const removendoAdmin = (data.perfil !== undefined && data.perfil !== 'administrador') || data.ativo === false
    if (removendoAdmin) await verificarUltimoAdmin(id)
  }

  // Hash fora da transação para não segurar a conexão durante operação CPU-bound
  const senhaHash = data.senha ? await bcrypt.hash(data.senha, BCRYPT_ROUNDS) : undefined

  return prisma.$transaction(async (tx) => {
    const atualizado = await tx.usuario.update({
      where: { id },
      data: {
        ...(data.nome      !== undefined && { nome:      data.nome }),
        ...(data.perfil    !== undefined && { perfil:    data.perfil }),
        ...(data.ativo     !== undefined && { ativo:     data.ativo }),
        ...(senhaHash      !== undefined && { senhaHash }),
      },
      select: SELECT_SEM_SENHA,
    })
    await createLog({
      usuarioId:     solicitanteId,
      acao:          'editar',
      tabelaAfetada: 'usuarios',
      registroId:    id,
      detalhe:       { nome: data.nome, perfil: data.perfil, ativo: data.ativo, senhaAlterada: !!data.senha },
    }, tx)
    return atualizado
  })
}

export async function inativarUsuarioService(id: string, solicitanteId: string) {
  if (id === solicitanteId) {
    throw new AppError('Você não pode desativar sua própria conta.', 403)
  }

  const usuario = await prisma.usuario.findFirst({ where: { id, deletedAt: null } })
  if (!usuario) throw new AppError('Usuário não encontrado.', 404)

  if (usuario.perfil === 'administrador') await verificarUltimoAdmin(id)

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id }, data: { deletedAt: new Date(), ativo: false } })
    await createLog({ usuarioId: solicitanteId, acao: 'inativar', tabelaAfetada: 'usuarios', registroId: id }, tx)
  })
}
