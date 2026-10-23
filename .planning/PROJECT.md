# Family Finance

## What This Is

O Family Finance é uma aplicação web de gestão financeira familiar para ajudar uma família a sair de registros financeiros dispersos e entender, com confiança, o dinheiro disponível, as receitas, as despesas e os compromissos. A interface será especialmente simples e responsiva para uso pelos pais em celulares, enquanto o administrador acompanha os dados, orienta o planejamento e trata inconsistências.

## Core Value

A família consegue registrar movimentações reais com facilidade e confiar que cada saldo e resumo representa o histórico financeiro auditável.

## Business Context

- **Customer**: Inicialmente uma família, com acesso de administrador e usuários da família.
- **Revenue model**: Ferramenta privada sem monetização planejada.
- **Success metric**: A família registra suas movimentações e consegue responder quanto tem disponível, quanto ganhou e gastou, para onde o dinheiro foi, o que vence e se sua situação está melhorando.
- **Strategy notes**: A visão de longo prazo é apoiar organização, estabilização, eliminação de dívidas, reserva de emergência e construção patrimonial.

## Requirements

### Validated

<!-- Capacidades já presentes no código; interfaces operacionais ainda podem estar incompletas. -->

- ✓ Autenticação por credenciais e sessões com verificação de usuários e papéis ADMIN/FAMILY — existente (`src/auth.ts`, `src/lib/auth/guards.ts`).
- ✓ Persistência PostgreSQL com Prisma, schema e histórico de migrations — existente (`src/lib/prisma.ts`, `prisma/schema.prisma`, `prisma/migrations/`).
- ✓ Base de domínio financeiro para contas, categorias, transações e transferências, com validação, autorização e auditoria em operações de serviço — existente (`src/lib/finance/`, `src/lib/finance/services/`).
- ✓ Regras fundamentais de precisão monetária e autorização têm testes dedicados — existente (`src/lib/finance/money.ts`, `src/lib/finance/authorization.ts`, `tests/finance-money.test.ts`, `tests/finance-authorization.test.ts`).

### Active

<!-- Escopo do MVP operacional; hipóteses até serem entregues e validadas com a família. -->

- [ ] Oferecer fluxos simples e responsivos para a família registrar receitas, despesas e saldos informados, e para o administrador gerenciar contas e categorias.
- [ ] Persistir movimentações reais no PostgreSQL, com validação financeira, autorização e rastreabilidade de alterações.
- [ ] Tratar transferências entre contas sem contabilizá-las como receita ou despesa, mantendo os saldos corretos.
- [ ] Disponibilizar histórico de movimentações consultável e filtrável.
- [ ] Calcular saldos por conta e consolidados e apresentar resumo mensal usando exclusivamente dados persistidos da família.
- [ ] Implementar conciliação diária entre saldo calculado e saldo informado, registrando divergências e correções de forma auditável, sem alterar silenciosamente o histórico original.
- [ ] Manter autenticação, autorização por papel e isolamento dos dados financeiros da família; iniciar com uma família e preservar um caminho de evolução para múltiplas famílias.
- [ ] Validar regras financeiras críticas com testes, incluindo dinheiro, saldos, transferências, autorização, conciliação e trilha de auditoria.
- [ ] Substituir os indicadores demonstrativos do dashboard por consultas confiáveis do domínio financeiro.

### Out of Scope

- Controle completo de dívidas, credores, parcelas, vencimentos e pagamentos parciais — será a próxima etapa depois da validação da operação financeira básica.
- Contas recorrentes, orçamentos avançados, metas patrimoniais e estratégias de redução de dívidas — previstos para etapas posteriores de planejamento.
- Interpretação automática de mensagens de WhatsApp, recomendações e alertas inteligentes — visão futura; qualquer importação deverá mostrar uma prévia para confirmação humana antes de registrar lançamentos.
- Operação de múltiplas famílias e onboarding self-service — não faz parte do primeiro MVP, embora o isolamento dos dados deva orientar a arquitetura.
- Aplicativo nativo ou PWA — possibilidade futura; o MVP será uma aplicação web responsiva.

## Context

- O projeto nasceu para substituir anotações informais compartilhadas pela família por mensagens de WhatsApp, que não oferecem padronização, histórico confiável nem conciliação.
- Os usuários iniciais são uma família. O administrador configura contas e categorias, acompanha relatórios e revisa inconsistências; os familiares precisam registrar receitas, despesas, pagamentos e saldos com poucas interações.
- A conclusão do MVP será avaliada pela capacidade de responder, com dados reais: quanto dinheiro há disponível hoje; quanto entrou e saiu no mês; para onde o dinheiro foi; quais compromissos vencem; e se a situação financeira está melhorando ou piorando.
- A aplicação existente usa Next.js, TypeScript, Tailwind CSS, Auth.js, Prisma e PostgreSQL, com implantação por Docker/Coolify documentada em `README.md` e `Dockerfile`.
- Autenticação, schema PostgreSQL e serviços do domínio financeiro já existem. O dashboard ainda usa dados demonstrativos (`src/components/dashboard/overview-data.ts`), e os serviços precisam ser conectados a fluxos operacionais para a família.
- O domínio inclui receitas variáveis, como ganhos com aplicativos de transporte, além de despesas domésticas, alimentação, saúde, combustível e manutenção de veículos (`docs/financial-domain.md`).
- A base registra auditoria junto a operações financeiras, mas as regras de conciliação, resolução de divergências e isolamento futuro entre famílias ainda precisam ser definidas e implementadas.

## Constraints

- **Tecnologia**: Evoluir a aplicação Next.js/TypeScript com Prisma e PostgreSQL existentes — preservar a infraestrutura e evitar reconstruir componentes que já funcionam.
- **Integridade financeira**: Usar precisão monetária e regras explícitas; transferências não podem inflar receitas ou despesas — os saldos devem permanecer reconciliáveis.
- **Rastreabilidade**: Divergências e correções precisam deixar histórico auditável — não sobrescrever silenciosamente lançamentos financeiros anteriores.
- **Segurança**: Proteger dados por autenticação, autorização e isolamento de família — a informação é privada e pode se expandir para múltiplas famílias no futuro.
- **Experiência**: Priorizar fluxos responsivos, simples e com poucas interações em celulares — os usuários familiares podem ter pouca familiaridade tecnológica.
- **Entrega**: Avançar em etapas com critérios de aceitação e validação antes da próxima etapa — o trabalho deve reutilizar a base atual.

## Key Decisions

<!-- Decisões que orientam escopo e implementação. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| O MVP começa com uma família e mantém como requisito o isolamento dos dados para uma possível expansão | O uso inicial é familiar e privado; múltiplas famílias ficam para depois | — Pending |
| A primeira entrega operacional inclui contas, categorias, receitas, despesas, transferências, histórico, saldos, resumo mensal e conciliação diária | Esse escopo substitui os dados demonstrativos e entrega a operação básica pedida | — Pending |
| Divergências e correções de conciliação preservam o histórico original e são auditáveis | A família precisa identificar e corrigir diferenças sem perder rastreabilidade | — Pending |
| A evolução reutiliza a arquitetura existente e ocorre incrementalmente | Evita reconstruções desnecessárias e permite validar cada etapa | — Pending |
| Dívidas, parcelas, vencimentos e compromissos recorrentes vêm após validar a operação básica | Mantém a sequência de produto definida para o MVP | — Pending |
| A interpretação de mensagens de WhatsApp fica para uma etapa futura e exige confirmação humana antes da gravação | Reduz risco de registrar automaticamente dados financeiros mal interpretados | — Pending |

## Evolution

Este documento evolui nas transições de fase e nos limites de milestone.

**Após cada transição de fase** (via `$gsd-transition`):
1. Mover requisitos invalidados para Out of Scope com a justificativa.
2. Mover requisitos validados para Validated com a referência da fase.
3. Adicionar requisitos novos surgidos durante a execução.
4. Registrar decisões tomadas e seus resultados.
5. Confirmar que What This Is ainda descreve o produto atual.

**Após cada milestone** (via `$gsd-complete-milestone`):
1. Revisar todas as seções.
2. Confirmar se Core Value continua sendo a prioridade correta.
3. Revisar as razões para os itens em Out of Scope.
4. Atualizar o Contexto com uso, feedback e métricas atuais.

---
*Last updated: 2026-10-23 after initialization*
