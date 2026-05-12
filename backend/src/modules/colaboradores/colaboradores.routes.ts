import type { FastifyInstance } from 'fastify'
import { criarColaboradorSchema, atualizarColaboradorSchema, listarColaboradoresQuerySchema } from './colaboradores.schema'
import {
  criarColaboradorService,
  listarColaboradoresService,
  buscarColaboradorService,
  atualizarColaboradorService,
  inativarColaboradorService,
} from './colaboradores.service'

function sanitizarParaLeitor(obj: Record<string, unknown>) {
  const resultado = { ...obj }
  delete resultado.valorDiaria
  return resultado
}

export async function colaboradoresRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = criarColaboradorSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const colaborador = await criarColaboradorService(parsed.data, request.user.sub)
    return reply.status(201).send(colaborador)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const parsed = listarColaboradoresQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    const resultado = await listarColaboradoresService(parsed.data)
    if (request.user.perfil !== 'leitor') return reply.send(resultado)
    return reply.send({ ...resultado, items: resultado.items.map(sanitizarParaLeitor) })
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['leitor', 'editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const colaborador = await buscarColaboradorService(id)
    if (request.user.perfil !== 'leitor') return reply.send(colaborador)
    return reply.send(sanitizarParaLeitor(colaborador as unknown as Record<string, unknown>))
  })

  app.patch('/:id', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = atualizarColaboradorSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const colaborador = await atualizarColaboradorService(id, parsed.data, request.user.sub)
    return reply.send(colaborador)
  })

  app.delete('/:id', {
    preHandler: [app.authenticate, app.authorize(['editor', 'administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await inativarColaboradorService(id, request.user.sub)
    return reply.status(204).send()
  })
}
