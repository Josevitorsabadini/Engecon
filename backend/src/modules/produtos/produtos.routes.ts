import type { FastifyInstance } from 'fastify'
import { criarProdutoSchema, atualizarProdutoSchema, listarProdutosQuerySchema } from './produtos.schema'
import {
  criarProdutoService,
  listarProdutosService,
  buscarProdutoService,
  atualizarProdutoService,
  inativarProdutoService,
} from './produtos.service'

const CAMPOS_NUMERICOS = ['valorUnitario'] as const

function sanitizarParaLeitor(obj: Record<string, unknown>) {
  const resultado = { ...obj }
  for (const campo of CAMPOS_NUMERICOS) delete resultado[campo]
  if (resultado.estoque && typeof resultado.estoque === 'object') {
    const estoque = { ...(resultado.estoque as Record<string, unknown>) }
    delete estoque.quantidade
    delete estoque.valorUnitario
    delete estoque.valorTotal
    resultado.estoque = estoque
  }
  return resultado
}

export async function produtosRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = criarProdutoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const produto = await criarProdutoService(parsed.data, request.user.sub)
    return reply.status(201).send(produto)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = listarProdutosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    const resultado = await listarProdutosService(parsed.data)
    if (request.user.perfil !== 'leitor') return reply.send(resultado)
    return reply.send({ ...resultado, items: resultado.items.map(sanitizarParaLeitor) })
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const produto = await buscarProdutoService(id)
    if (request.user.perfil !== 'leitor') return reply.send(produto)
    return reply.send(sanitizarParaLeitor(produto as unknown as Record<string, unknown>))
  })

  app.patch('/:id', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = atualizarProdutoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const produto = await atualizarProdutoService(id, parsed.data, request.user.sub)
    return reply.send(produto)
  })

  app.delete('/:id', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await inativarProdutoService(id, request.user.sub)
    return reply.status(204).send()
  })
}
