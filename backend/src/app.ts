import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import { errorHandler } from './plugins/error-handler'
import { authRoutes } from './modules/auth/auth.routes'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { sub: string; perfil: 'leitor' | 'editor' | 'administrador' }
  }
}

function getCorsOrigin(): string | string[] | false {
  const raw = process.env.CORS_ORIGIN
  if (!raw) return false
  const origins = raw.split(',').map((o) => o.trim())
  return origins.length === 1 ? origins[0] : origins
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      ...(process.env.NODE_ENV !== 'production' && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
    },
  })

  // Fase 1 — segurança
  await app.register(helmet)

  await app.register(cors, {
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
  })

  app.setErrorHandler(errorHandler)

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Rota não encontrada.',
    })
  })

  // Fase 2 — autenticação
  await app.register(fastifyCookie)

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-troque-em-producao',
  })

  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token inválido ou ausente.',
      })
    }
  })

  await app.register(authRoutes)

  // Fases 4–7 — rotas dos módulos

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
