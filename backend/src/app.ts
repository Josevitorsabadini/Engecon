import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import { errorHandler } from './plugins/error-handler'
import { authRoutes } from './modules/auth/auth.routes'
import { movimentacoesRoutes } from './modules/movimentacoes/movimentacoes.routes'
import { produtosRoutes } from './modules/produtos/produtos.routes'
import { estoqueRoutes } from './modules/estoque/estoque.routes'
import { colaboradoresRoutes } from './modules/colaboradores/colaboradores.routes'
import { alocacoesRoutes } from './modules/alocacoes/alocacoes.routes'
import { fornecedoresRoutes } from './modules/fornecedores/fornecedores.routes'
import { depositosRoutes } from './modules/depositos/depositos.routes'

type Perfil = 'leitor' | 'editor' | 'administrador'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorize: (perfis: Perfil[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
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

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) throw new Error('JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar o servidor.')

  await app.register(fastifyJwt, { secret: jwtSecret })

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

  app.decorate('authorize', function (perfis: Perfil[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!perfis.includes(request.user.perfil)) {
        reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Seu perfil não tem permissão para esta operação.',
        })
      }
    }
  })

  await app.register(authRoutes)

  // Fases 4–7 — rotas dos módulos
  await app.register(movimentacoesRoutes, { prefix: '/movimentacoes' })
  await app.register(produtosRoutes,      { prefix: '/produtos' })
  await app.register(estoqueRoutes,       { prefix: '/estoque' })
  await app.register(colaboradoresRoutes, { prefix: '/colaboradores' })
  await app.register(alocacoesRoutes,     { prefix: '/alocacoes' })
  await app.register(fornecedoresRoutes,  { prefix: '/fornecedores' })
  await app.register(depositosRoutes,     { prefix: '/depositos' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
