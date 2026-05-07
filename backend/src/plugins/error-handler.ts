import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = error.statusCode ?? 500
  const isProd = process.env.NODE_ENV === 'production'

  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Dados inválidos na requisição.',
    })
  }

  if (statusCode < 500) {
    return reply.status(statusCode).send({
      statusCode,
      error: error.name ?? 'Error',
      message: error.message,
    })
  }

  request.log.error({ err: error }, 'Internal error')
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: isProd ? 'Erro interno. Tente novamente mais tarde.' : error.message,
  })
}
