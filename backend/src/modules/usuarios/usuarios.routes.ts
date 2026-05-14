import type { FastifyInstance } from 'fastify'
import { criarUsuarioSchema, atualizarUsuarioSchema, listarUsuariosQuerySchema } from './usuarios.schema'
import {
  criarUsuarioService,
  listarUsuariosService,
  buscarUsuarioService,
  atualizarUsuarioService,
  inativarUsuarioService,
} from './usuarios.service'

export async function usuariosRoutes(app: FastifyInstance) {
  app.post('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = criarUsuarioSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    const usuario = await criarUsuarioService(parsed.data, request.user.sub)
    return reply.status(201).send(usuario)
  })

  app.get('/', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const parsed = listarUsuariosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Parâmetros de filtro inválidos.',
      })
    }
    return reply.send(await listarUsuariosService(parsed.data))
  })

  app.get('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await buscarUsuarioService(id))
  })

  app.patch('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = atualizarUsuarioSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: parsed.error.issues[0]?.message ?? 'Dados inválidos na requisição.',
      })
    }
    return reply.send(await atualizarUsuarioService(id, parsed.data, request.user.sub))
  })

  app.delete('/:id', {
    preHandler: [app.authenticate, app.authorize(['administrador'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await inativarUsuarioService(id, request.user.sub)
    return reply.status(204).send()
  })
}
