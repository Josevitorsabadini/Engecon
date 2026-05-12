import { z } from 'zod'

export const criarAlocacaoSchema = z
  .object({
    colaboradorId: z.string().uuid('colaboradorId deve ser um UUID válido.'),
    obraId:        z.string().uuid('obraId deve ser um UUID válido.'),
    dataInicio:    z.string().date('dataInicio deve estar no formato YYYY-MM-DD.'),
    dataFim:       z.string().date('dataFim deve estar no formato YYYY-MM-DD.').optional(),
  })
  .refine(
    (d) => !d.dataFim || d.dataFim >= d.dataInicio,
    { message: 'dataFim não pode ser anterior a dataInicio.', path: ['dataFim'] },
  )

export const atualizarAlocacaoSchema = z.object({
  dataFim: z.string().date('dataFim deve estar no formato YYYY-MM-DD.'),
})

export const listarAlocacoesQuerySchema = z.object({
  colaboradorId:   z.string().uuid().optional(),
  obraId:          z.string().uuid().optional(),
  dataInicioFrom:  z.string().date().optional(),
  dataInicioTo:    z.string().date().optional(),
  page:            z.coerce.number().int().positive().default(1),
  pageSize:        z.coerce.number().int().positive().max(100).default(20),
})

export type CriarAlocacaoInput    = z.infer<typeof criarAlocacaoSchema>
export type AtualizarAlocacaoInput = z.infer<typeof atualizarAlocacaoSchema>
export type ListarAlocacoesQuery  = z.infer<typeof listarAlocacoesQuerySchema>
