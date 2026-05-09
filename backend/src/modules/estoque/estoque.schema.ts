import { z } from 'zod'

export const listarEstoqueQuerySchema = z.object({
  search:   z.string().optional(),
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type ListarEstoqueQuery = z.infer<typeof listarEstoqueQuerySchema>
