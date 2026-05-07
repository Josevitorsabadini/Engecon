import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { prisma } from '../../lib/prisma'
import { isLocked, recordFailure, resetAttempts } from '../../lib/brute-force'
import { AppError } from '../../lib/errors'

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function loginService(email: string, senha: string) {
  if (isLocked(email)) {
    throw new AppError('Conta temporariamente bloqueada. Tente novamente em 15 minutos.', 429)
  }

  const usuario = await prisma.usuario.findFirst({
    where: { email, deletedAt: null, ativo: true },
  })

  const senhaValida = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false

  if (!usuario || !senhaValida) {
    recordFailure(email)
    throw new AppError('Credenciais inválidas.', 401)
  }

  resetAttempts(email)

  // Remove tokens expirados do usuário
  await prisma.refreshToken.deleteMany({
    where: { usuarioId: usuario.id, expiresAt: { lt: new Date() } },
  })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

  await prisma.refreshToken.create({
    data: { token, usuarioId: usuario.id, expiresAt },
  })

  return {
    refreshToken: token,
    user: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
  }
}

export async function refreshService(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      usuario: { select: { id: true, perfil: true, ativo: true, deletedAt: true } },
    },
  })

  if (!stored || stored.expiresAt < new Date() || !stored.usuario.ativo || stored.usuario.deletedAt) {
    throw new AppError('Refresh token inválido ou expirado.', 401)
  }

  return { id: stored.usuario.id, perfil: stored.usuario.perfil }
}

export async function logoutService(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } })
}
