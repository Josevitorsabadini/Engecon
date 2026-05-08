# Engecon — Guia para o Claude

Sistema de gestão interna para uma empresa de engenharia: materiais, estoque, colaboradores e obras.
Backend Node.js + Fastify · Banco PostgreSQL via Supabase (host only) · Frontend React (fase futura).

---

## Início de sessão — leitura obrigatória

Leia nesta ordem antes de qualquer trabalho:

1. `Obsidian/ÍNDICE.md` — mapa completo do projeto e **Fase Atual**
2. `Obsidian/Arquitetura/Padrões de Desenvolvimento.md` — como rodar, migrations, padrão de módulo, infra pendente
3. `Obsidian/Cronograma/Fases.md` — status de cada fase e detalhes da fase atual
4. `Obsidian/Decisões e Alterações.md` — decisões recentes (mais recentes no topo)

Não comece a implementar antes de ter lido os quatro.

---

## O Obsidian é a base — escreva nele durante o trabalho

O Obsidian é o que permite que cada sessão comece com contexto completo. Mantê-lo atualizado não é opcional.

### Escreva imediatamente quando:

**Decisão tomada ou problema resolvido de forma não óbvia**
→ Adicione entrada em `Obsidian/Decisões e Alterações.md` seguindo o template já presente no arquivo.
Critérios detalhados de "quando registrar" estão no próprio arquivo — consulte-os.

**Fase concluída**
→ Marque `✅ Concluída` na coluna Status de `Obsidian/Cronograma/Fases.md`
→ Avance "Fase Atual" em `Obsidian/ÍNDICE.md`
→ Marque a próxima fase como `⏳ Em andamento`

**Novo padrão arquitetural adotado**
→ Atualize `Obsidian/Arquitetura/Padrões de Desenvolvimento.md`

**Mudança no banco de dados**
→ Atualize `Obsidian/Banco de dados/Banco.sql.md`, `Relacionamentos.md` e `Documentação banco.md` conforme o impacto

---

## Regras absolutas — nunca faça

- **Nunca rode `prisma migrate dev`** — o projeto usa SQL manual aplicado no Supabase + `prisma migrate resolve --applied`. Ver fluxo completo em `Padrões de Desenvolvimento.md`
- **Nunca escreva em `valor_total`** — é coluna `GENERATED ALWAYS AS` no banco; atualiza sozinha
- **Nunca commite o `.env`** — está no `.gitignore` corretamente
- **Nunca exponha stack trace ao cliente** — o error handler centralizado em `src/plugins/error-handler.ts` já trata isso; não contorne

---

## Fim de sessão — checklist

Antes de encerrar, verifique:

- [ ] Decisões não óbvias tomadas → registradas em `Decisões e Alterações.md`?
- [ ] Fase concluída → `Fases.md` e `ÍNDICE.md` atualizados?
- [ ] Novo padrão adotado → `Padrões de Desenvolvimento.md` atualizado?
- [ ] Mudança no banco → docs do banco atualizados?
- [ ] Commit feito com mensagem descritiva?
