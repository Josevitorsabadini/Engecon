import { z } from 'zod'

export const criarFornecedorSchema = z.object({
  nome:        z.string().min(1, 'nome é obrigatório.').max(200),
  cnpjCpf:     z.string().min(1).max(20).optional(),
  telefone:    z.string().max(20).optional(),
  email:       z.string().email('email inválido.').optional(),
  observacoes: z.string().optional(),
})

export const atualizarFornecedorSchema = z
  .object({
    nome:        z.string().min(1).max(200).optional(),
    cnpjCpf:     z.string().min(1).max(20).optional(),
    telefone:    z.string().max(20).optional(),
    email:       z.string().email('email inválido.').optional(),
    observacoes: z.string().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Pelo menos um campo deve ser fornecido para atualização.',
  })

export const listarFornecedoresQuerySchema = z.object({
  search:   z.string().optional(),
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type CriarFornecedorInput     = z.infer<typeof criarFornecedorSchema>
export type AtualizarFornecedorInput = z.infer<typeof atualizarFornecedorSchema>
export type ListarFornecedoresQuery  = z.infer<typeof listarFornecedoresQuerySchema>
