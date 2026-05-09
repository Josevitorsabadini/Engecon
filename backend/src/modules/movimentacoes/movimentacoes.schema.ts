import { z } from 'zod'

const tipoMovimentacao = z.enum(['entrada', 'saida', 'transferencia', 'ajuste'])
const tipoEntidade = z.enum(['obra', 'fornecedor', 'deposito'])

export const criarMovimentacaoSchema = z
  .object({
    tipo:          tipoMovimentacao,
    produtoId:     z.string().uuid('produtoId deve ser um UUID válido.'),
    quantidade:    z.number({ required_error: 'quantidade é obrigatória.' }).min(0, 'quantidade não pode ser negativa.'),
    valorUnitario: z.number().positive('valorUnitario deve ser positivo.').optional(),
    origemTipo:    tipoEntidade.optional(),
    origemId:      z.string().uuid().optional(),
    destinoTipo:   tipoEntidade.optional(),
    destinoId:     z.string().uuid().optional(),
    obraId:        z.string().uuid().optional(),
    fornecedorId:  z.string().uuid().optional(),
    observacoes:   z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo !== 'ajuste') {
      if (data.quantidade <= 0) {
        ctx.addIssue({ code: 'too_small', minimum: 0, inclusive: false, type: 'number', message: 'quantidade deve ser positiva.', path: ['quantidade'] })
      }
      if (data.valorUnitario === undefined) {
        ctx.addIssue({ code: 'invalid_type', expected: 'number', received: 'undefined', message: 'valorUnitario é obrigatório.', path: ['valorUnitario'] })
      }
    }
  })

export const listarMovimentacoesQuerySchema = z.object({
  tipo:       tipoMovimentacao.optional(),
  produtoId:  z.string().uuid().optional(),
  dataInicio: z.string().datetime({ offset: true }).optional(),
  dataFim:    z.string().datetime({ offset: true }).optional(),
  page:       z.coerce.number().int().positive().default(1),
  pageSize:   z.coerce.number().int().positive().max(100).default(20),
})

export type CriarMovimentacaoInput  = z.infer<typeof criarMovimentacaoSchema>
export type ListarMovimentacoesQuery = z.infer<typeof listarMovimentacoesQuerySchema>
