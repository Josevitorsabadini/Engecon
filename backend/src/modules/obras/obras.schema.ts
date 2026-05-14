import { z } from 'zod'

const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD.')

export const criarObraSchema = z.object({
  nome:            z.string().min(1, 'nome é obrigatório.').max(200),
  endereco:        z.string().optional(),
  status:          z.enum(['ativa', 'pausada', 'encerrada']).default('ativa'),
  dataInicio:      dataSchema.optional(),
  dataPrevisaoFim: dataSchema.optional(),
  dataFim:         dataSchema.optional(),
})

export const atualizarObraSchema = z
  .object({
    nome:            z.string().min(1).max(200).optional(),
    endereco:        z.string().optional(),
    status:          z.enum(['ativa', 'pausada', 'encerrada']).optional(),
    dataInicio:      dataSchema.optional(),
    dataPrevisaoFim: dataSchema.optional(),
    dataFim:         dataSchema.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Pelo menos um campo deve ser fornecido para atualização.',
  })

export const listarObrasQuerySchema = z.object({
  search:   z.string().optional(),
  status:   z.enum(['ativa', 'pausada', 'encerrada']).optional(),
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type CriarObraInput     = z.infer<typeof criarObraSchema>
export type AtualizarObraInput = z.infer<typeof atualizarObraSchema>
export type ListarObrasQuery   = z.infer<typeof listarObrasQuerySchema>
