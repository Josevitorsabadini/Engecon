import type { FastifyInstance } from 'fastify'
import { criarDepositoSchema, atualizarDepositoSchema, listarDepositosQuerySchema } from './depositos.schema'
import {
  criarDepositoService,
  listarDepositosService,
  buscarDepositoService,
  atualizarDepositoService,
  inativarDepositoService,
} from './depositos.service'

export async function depositosRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = criarDepositoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const deposito = await criarDepositoService(parsed.data, request.user.sub)
    return reply.status(201).send(deposito)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = listarDepositosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    return reply.send(await listarDepositosService(parsed.data))
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await buscarDepositoService(id))
  })

  app.patch('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = atualizarDepositoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    return reply.send(await atualizarDepositoService(id, parsed.data, request.user.sub))
  })

  app.delete('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await inativarDepositoService(id, request.user.sub)
    return reply.status(204).send()
  })
}
