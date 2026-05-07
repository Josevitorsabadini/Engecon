import type { FastifyInstance } from 'fastify'
import { loginBodySchema } from './auth.schema'
import { loginService, refreshService, logoutService } from './auth.service'

const REFRESH_COOKIE = 'refresh_token'

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Dados inválidos na requisição.',
      })
    }

    const { email, senha } = parsed.data
    const { refreshToken, user } = await loginService(email, senha)

    const accessToken = app.jwt.sign(
      { sub: user.id, perfil: user.perfil },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
    )

    return reply
      .setCookie(REFRESH_COOKIE, refreshToken, cookieOpts)
      .send({ accessToken, user: { id: user.id, nome: user.nome, perfil: user.perfil } })
  })

  app.post('/auth/refresh', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE]
    if (!token) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Refresh token ausente.',
      })
    }

    const user = await refreshService(token)

    const accessToken = app.jwt.sign(
      { sub: user.id, perfil: user.perfil },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
    )

    return reply.send({ accessToken })
  })

  app.post('/auth/logout', { preHandler: [app.authenticate] }, async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE]
    if (token) {
      await logoutService(token)
    }
    return reply.clearCookie(REFRESH_COOKIE, { path: '/' }).send({ message: 'Logout realizado.' })
  })
}
