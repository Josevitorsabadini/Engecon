import { z } from 'zod'

const tipoMovimentacao = z.enum(['entrada', 'saida', 'transferencia'])
const tipoEntidade = z.enum(['obra', 'fornecedor', 'deposito'])

export const criarMovimentacaoSchema = z.object({
  tipo:          tipoMovimentacao,
  produtoId:     z.string().uuid('produtoId deve ser um UUID válido.'),
  quantidade:    z.number({ required_error: 'quantidade é obrigatória.' }).positive('quantidade deve ser positiva.'),
  valorUnitario: z.number({ required_error: 'valorUnitario é obrigatório.' }).positive('valorUnitario deve ser positivo.'),
  origemTipo:    tipoEntidade.optional(),
  origemId:      z.string().uuid().optional(),
  destinoTipo:   tipoEntidade.optional(),
  destinoId:     z.string().uuid().optional(),
  obraId:        z.string().uuid().optional(),
  fornecedorId:  z.string().uuid().optional(),
  observacoes:   z.string().max(1000).optional(),
})

export const listarMovimentacoesQuerySchema = z.object({
  tipo:       tipoMovimentacao.optional(),
  produtoId:  z.string().uuid().optional(),
  dataInicio: z.string().datetime({ offset: true }).optional(),
  dataFim:    z.string().datetime({ offset: true }).optional(),
  page:       z.coerce.number().int().positive().default(1),
  pageSize:   z.coerce.number().int().positive().max(100).default(20),
})

export type CriarMovimentacaoInput = z.infer<typeof criarMovimentacaoSchema>
export type ListarMovimentacoesQuery = z.infer<typeof listarMovimentacoesQuerySchema>
