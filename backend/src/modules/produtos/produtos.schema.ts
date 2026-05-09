import { z } from 'zod'

export const criarProdutoSchema = z.object({
  codigo:        z.string().min(1, 'codigo é obrigatório.').max(50),
  nome:          z.string().min(1, 'nome é obrigatório.').max(200),
  tipo:          z.string().max(100).optional(),
  unidadeMedida: z.string().min(1, 'unidadeMedida é obrigatória.').max(50),
  valorUnitario: z.number({ required_error: 'valorUnitario é obrigatório.' }).positive('valorUnitario deve ser positivo.'),
})

export const atualizarProdutoSchema = z
  .object({
    nome:          z.string().min(1).max(200).optional(),
    tipo:          z.string().max(100).optional(),
    unidadeMedida: z.string().min(1).max(50).optional(),
    valorUnitario: z.number().positive().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Pelo menos um campo deve ser fornecido para atualização.',
  })

export const listarProdutosQuerySchema = z.object({
  search:   z.string().optional(),
  tipo:     z.string().optional(),
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type CriarProdutoInput    = z.infer<typeof criarProdutoSchema>
export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>
export type ListarProdutosQuery  = z.infer<typeof listarProdutosQuerySchema>
