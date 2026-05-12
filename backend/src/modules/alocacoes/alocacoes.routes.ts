import type { FastifyInstance } from 'fastify'
import { criarAlocacaoSchema, atualizarAlocacaoSchema, listarAlocacoesQuerySchema } from './alocacoes.schema'
import {
  criarAlocacaoService,
  listarAlocacoesService,
  buscarAlocacaoService,
  atualizarAlocacaoService,
  excluirAlocacaoService,
} from './alocacoes.service'

export async function alocacoesRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = criarAlocacaoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const alocacao = await criarAlocacaoService(parsed.data, request.user.sub)
    return reply.status(201).send(alocacao)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = listarAlocacoesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    return reply.send(await listarAlocacoesService(parsed.data))
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await buscarAlocacaoService(id))
  })

  app.patch('/:id', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = atualizarAlocacaoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const alocacao = await atualizarAlocacaoService(id, parsed.data, request.user.sub)
    return reply.send(alocacao)
  })

  app.delete('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await excluirAlocacaoService(id, request.user.sub)
    return reply.status(204).send()
  })
}
