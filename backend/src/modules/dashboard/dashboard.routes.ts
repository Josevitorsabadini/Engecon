import type { FastifyInstance } from 'fastify'
import { listarObrasKpisQuerySchema } from './dashboard.schema'
import { listarObrasKpisService, kpisObraService } from './dashboard.service'

export async function dashboardRoutes(app: FastifyInstance) {
  // Lista todas as obras com KPIs — acessível a todos os perfis
  app.get('/obras', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = listarObrasKpisQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error:      'Bad Request',
        message:    parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }

    const resultado = await listarObrasKpisService(parsed.data)
    return reply.send(resultado)
  })

  // KPIs de uma obra específica
  app.get('/obras/:id', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return reply.status(400).send({
        statusCode: 400,
        error:      'Bad Request',
        message:    'ID inválido.',
      })
    }

    const resultado = await kpisObraService(id)
    return reply.send(resultado)
  })
}
