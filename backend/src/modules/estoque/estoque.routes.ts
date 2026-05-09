import type { FastifyInstance } from 'fastify'
import { listarEstoqueQuerySchema } from './estoque.schema'
import { listarEstoqueService, buscarEstoquePorProdutoService } from './estoque.service'

const CAMPOS_NUMERICOS_ESTOQUE = ['quantidade', 'valorUnitario', 'valorTotal'] as const

function sanitizarParaLeitor<T extends Record<string, unknown>>(obj: T) {
  const resultado = { ...obj }
  for (const campo of CAMPOS_NUMERICOS_ESTOQUE) delete resultado[campo]
  return resultado
}

export async function estoqueRoutes(app: FastifyInstance) {
  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = listarEstoqueQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    const resultado = await listarEstoqueService(parsed.data)
    if (request.user.perfil !== 'leitor') return reply.send(resultado)
    return reply.send({ ...resultado, items: resultado.items.map(sanitizarParaLeitor) })
  })

  app.get('/:produtoId', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const { produtoId } = request.params as { produtoId: string }
    const estoque = await buscarEstoquePorProdutoService(produtoId)
    if (request.user.perfil !== 'leitor') return reply.send(estoque)
    return reply.send(sanitizarParaLeitor(estoque as unknown as Record<string, unknown>))
  })
}
