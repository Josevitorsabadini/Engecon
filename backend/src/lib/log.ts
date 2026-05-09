import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

type PrismaTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

interface CreateLogParams {
  usuarioId: string
  acao: string
  tabelaAfetada: string
  registroId?: string
  detalhe?: Record<string, unknown>
}

export async function createLog(params: CreateLogParams, tx?: PrismaTx): Promise<void> {
  const client = tx ?? prisma
  await client.log.create({
    data: {
      usuarioId:     params.usuarioId,
      acao:          params.acao,
      tabelaAfetada: params.tabelaAfetada,
      registroId:    params.registroId,
      detalhe:       params.detalhe as Prisma.InputJsonValue | undefined,
    },
  })
}
