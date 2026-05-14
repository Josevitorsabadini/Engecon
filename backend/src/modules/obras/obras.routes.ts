import type { FastifyInstance } from 'fastify'
import { criarObraSchema, atualizarObraSchema, listarObrasQuerySchema } from './obras.schema'
import {
  criarObraService,
  listarObrasService,
  buscarObraService,
  atualizarObraService,
  inativarObraService,
} from './obras.service'

export async function obrasRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = criarObraSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const obra = await criarObraService(parsed.data, request.user.sub)
    return reply.status(201).send(obra)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = listarObrasQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    return reply.send(await listarObrasService(parsed.data))
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await buscarObraService(id))
  })

  app.patch('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = atualizarObraSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    return reply.send(await atualizarObraService(id, parsed.data, request.user.sub))
  })

  app.delete('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await inativarObraService(id, request.user.sub)
    return reply.status(204).send()
  })
}
