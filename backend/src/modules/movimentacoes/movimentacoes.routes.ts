import type { FastifyInstance } from 'fastify'
import { criarMovimentacaoSchema, listarMovimentacoesQuerySchema } from './movimentacoes.schema'
import {
  criarMovimentacaoService,
  listarMovimentacoesService,
  buscarMovimentacaoService,
} from './movimentacoes.service'

// Remove campos numéricos sensíveis para o perfil leitor
function sanitizarParaLeitor<T extends Record<string, unknown>>(obj: T): Omit<T, 'quantidade' | 'valorUnitario' | 'valorTotal'> {
  const { quantidade, valorUnitario, valorTotal, ...resto } = obj
  return resto as Omit<T, 'quantidade' | 'valorUnitario' | 'valorTotal'>
}

export async function movimentacoesRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = criarMovimentacaoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }

    const movimentacao = await criarMovimentacaoService(parsed.data, request.user.sub)
    return reply.status(201).send(movimentacao)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = listarMovimentacoesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }

    const resultado = await listarMovimentacoesService(parsed.data)
    const isLeitor = request.user.perfil === 'leitor'

    if (!isLeitor) return reply.send(resultado)

    return reply.send({
      ...resultado,
      items: resultado.items.map(sanitizarParaLeitor),
    })
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'ID inválido.',
      })
    }

    const movimentacao = await buscarMovimentacaoService(id)
    const isLeitor = request.user.perfil === 'leitor'

    return reply.send(isLeitor ? sanitizarParaLeitor(movimentacao as unknown as Record<string, unknown>) : movimentacao)
  })
}
