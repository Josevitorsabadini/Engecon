import { z } from 'zod'

export const criarDepositoSchema = z.object({
  nome:      z.string().min(1, 'nome é obrigatório.').max(200),
  descricao: z.string().optional(),
})

export const atualizarDepositoSchema = z
  .object({
    nome:      z.string().min(1).max(200).optional(),
    descricao: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Pelo menos um campo deve ser fornecido para atualização.',
  })

export const listarDepositosQuerySchema = z.object({
  search:   z.string().optional(),
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type CriarDepositoInput     = z.infer<typeof criarDepositoSchema>
export type AtualizarDepositoInput = z.infer<typeof atualizarDepositoSchema>
export type ListarDepositosQuery   = z.infer<typeof listarDepositosQuerySchema>
