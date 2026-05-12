import { z } from 'zod'

export const criarColaboradorSchema = z.object({
  nome:        z.string().min(1, 'nome é obrigatório.').max(200),
  cpf:         z.string().min(11).max(14).optional(),
  telefone:    z.string().max(20).optional(),
  cargo:       z.string().min(1, 'cargo é obrigatório.').max(100),
  valorDiaria: z.number({ required_error: 'valorDiaria é obrigatório.' }).positive('valorDiaria deve ser positivo.'),
  usuarioId:   z.string().uuid('usuarioId deve ser um UUID válido.').optional(),
})

export const atualizarColaboradorSchema = z
  .object({
    nome:        z.string().min(1).max(200).optional(),
    cpf:         z.string().min(11).max(14).optional(),
    telefone:    z.string().max(20).optional(),
    cargo:       z.string().min(1).max(100).optional(),
    valorDiaria: z.number().positive().optional(),
    status:      z.enum(['ativo', 'afastado']).optional(),
    usuarioId:   z.string().uuid('usuarioId deve ser um UUID válido.').optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Pelo menos um campo deve ser fornecido para atualização.',
  })

export const listarColaboradoresQuerySchema = z.object({
  status:   z.enum(['ativo', 'inativo', 'afastado']).optional(),
  search:   z.string().optional(),
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type CriarColaboradorInput    = z.infer<typeof criarColaboradorSchema>
export type AtualizarColaboradorInput = z.infer<typeof atualizarColaboradorSchema>
export type ListarColaboradoresQuery = z.infer<typeof listarColaboradoresQuerySchema>
