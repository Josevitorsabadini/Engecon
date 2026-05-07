import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { errorHandler } from './plugins/error-handler'

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

  // Fase 2 — autenticação (JWT, refresh token)
  // Fases 4–7 — rotas dos módulos

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
