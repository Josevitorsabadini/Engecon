import { z } from 'zod'

export const criarUsuarioSchema = z.object({
  nome:   z.string().min(1, 'nome é obrigatório.').max(200),
  email:  z.string().email('email inválido.'),
  senha:  z.string().min(8, 'senha deve ter no mínimo 8 caracteres.'),
  perfil: z.enum(['leitor', 'editor', 'administrador']),
})

export const atualizarUsuarioSchema = z
  .object({
    nome:   z.string().min(1).max(200).optional(),
    perfil: z.enum(['leitor', 'editor', 'administrador']).optional(),
    ativo:  z.boolean().optional(),
    senha:  z.string().min(8, 'senha deve ter no mínimo 8 caracteres.').optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Pelo menos um campo deve ser fornecido para atualização.',
  })

export const listarUsuariosQuerySchema = z.object({
  search:   z.string().optional(),
  perfil:   z.enum(['leitor', 'editor', 'administrador']).optional(),
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type CriarUsuarioInput     = z.infer<typeof criarUsuarioSchema>
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>
export type ListarUsuariosQuery   = z.infer<typeof listarUsuariosQuerySchema>
