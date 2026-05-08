import { PrismaClient, Perfil, StatusObra } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ─── Admin ────────────────────────────────────────────────────────────────
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@engecon.com'
  const senha = process.env.SEED_ADMIN_PASSWORD ?? 'Engecon@2026'
  const nome  = process.env.SEED_ADMIN_NOME    ?? 'Administrador'

  const senhaHash = await bcrypt.hash(senha, 10)

  const admin = await prisma.usuario.upsert({
    where:  { email },
    update: {},
    create: { nome, email, senhaHash, perfil: Perfil.administrador },
  })
  console.log(`[seed] admin ok: ${admin.email}`)

  // ─── Fornecedor ───────────────────────────────────────────────────────────
  const fornecedor = await prisma.fornecedor.upsert({
    where:  { cnpjCpf: '12.345.678/0001-99' },
    update: {},
    create: {
      nome:       'Distribuidora Central de Materiais',
      cnpjCpf:    '12.345.678/0001-99',
      telefone:   '(11) 99999-0000',
      email:      'contato@distcentral.com',
    },
  })
  console.log(`[seed] fornecedor ok: ${fornecedor.nome}`)

  // ─── Depósito ─────────────────────────────────────────────────────────────
  const DEPOSITO_ID = '00000000-0000-0000-0001-000000000001'
  const deposito = await prisma.deposito.upsert({
    where:  { id: DEPOSITO_ID },
    update: {},
    create: {
      id:       DEPOSITO_ID,
      nome:     'Almoxarifado Central',
      descricao: 'Depósito principal da Engecon',
    },
  })
  console.log(`[seed] deposito ok: ${deposito.nome}`)

  // ─── Obra ─────────────────────────────────────────────────────────────────
  const OBRA_ID = '00000000-0000-0000-0002-000000000001'
  const obra = await prisma.obra.upsert({
    where:  { id: OBRA_ID },
    update: {},
    create: {
      id:         OBRA_ID,
      nome:       'Obra Piloto — Sede',
      endereco:   'Rua das Obras, 100 — São Paulo/SP',
      status:     StatusObra.ativa,
      dataInicio: new Date('2026-01-01'),
    },
  })
  console.log(`[seed] obra ok: ${obra.nome}`)

  // ─── Produtos ─────────────────────────────────────────────────────────────
  const produtos = [
    { codigo: 'CIM-001', nome: 'Cimento Portland CP-II 50kg',   tipo: 'Cimento',    unidadeMedida: 'saco',     valorUnitario: 38.5  },
    { codigo: 'FER-001', nome: 'Ferro CA-50 10mm 12m',           tipo: 'Ferragem',   unidadeMedida: 'barra',    valorUnitario: 42.0  },
    { codigo: 'ARG-001', nome: 'Areia Média Lavada',              tipo: 'Agregado',   unidadeMedida: 'm³',       valorUnitario: 120.0 },
    { codigo: 'TIJ-001', nome: 'Tijolo Cerâmico 9 furos',        tipo: 'Alvenaria',  unidadeMedida: 'milheiro', valorUnitario: 850.0 },
    { codigo: 'CAB-001', nome: 'Cabo Elétrico 2,5mm² Flexível',  tipo: 'Elétrico',   unidadeMedida: 'metro',    valorUnitario: 3.8   },
  ]

  for (const p of produtos) {
    const produto = await prisma.produto.upsert({
      where:  { codigo: p.codigo },
      update: {},
      create: p,
    })
    console.log(`[seed] produto ok: ${produto.codigo} — ${produto.nome}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
