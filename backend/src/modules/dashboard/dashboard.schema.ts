import { z } from 'zod'

export const listarObrasKpisQuerySchema = z.object({
  status: z.enum(['ativa', 'pausada', 'encerrada']).optional(),
})

export type ListarObrasKpisQuery = z.infer<typeof listarObrasKpisQuerySchema>
