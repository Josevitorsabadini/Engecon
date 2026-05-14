import type { FastifyInstance } from 'fastify'
import { criarFornecedorSchema, atualizarFornecedorSchema, listarFornecedoresQuerySchema } from './fornecedores.schema'
import {
  criarFornecedorService,
  listarFornecedoresService,
  buscarFornecedorService,
  atualizarFornecedorService,
  inativarFornecedorService,
} from './fornecedores.service'

export async function fornecedoresRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = criarFornecedorSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const fornecedor = await criarFornecedorService(parsed.data, request.user.sub)
    return reply.status(201).send(fornecedor)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = listarFornecedoresQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    return reply.send(await listarFornecedoresService(parsed.data))
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await buscarFornecedorService(id))
  })

  app.patch('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = atualizarFornecedorSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    return reply.send(await atualizarFornecedorService(id, parsed.data, request.user.sub))
  })

  app.delete('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await inativarFornecedorService(id, request.user.sub)
    return reply.status(204).send()
  })
}
