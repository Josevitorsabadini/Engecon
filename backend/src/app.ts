import Fastify from 'fastify'

export function buildApp() {
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

  // Fase 1 — plugins de segurança (helmet, cors, rate-limit, error handler)
  // Fase 2 — autenticação (JWT, refresh token)
  // Fases 4–7 — rotas dos módulos

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
