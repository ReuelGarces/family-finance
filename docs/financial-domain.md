# Fundação do domínio financeiro

## Valores monetários

Valores persistidos usam `DECIMAL(14,2)` no PostgreSQL e `Prisma.Decimal` no código. As entradas de dinheiro dos serviços são textos decimais, por exemplo `"12.50"`; números JavaScript, separador de milhar, vírgula decimal, expoente, valores negativos e zero para movimentações são rejeitados. O saldo inicial pode ser zero, mas nunca negativo.

As operações usam somente `Decimal.plus` e `Decimal.minus`. Não há conversão para `number` nem aritmética de ponto flutuante no cálculo financeiro.

## Fórmula de saldo

Para uma conta e uma data de consulta `D`, considerando apenas registros `POSTED` e datas a partir da `referenceDate` da conta:

```text
saldo(D) = saldoInicial
         + receitas até D
         - despesas até D
         + transferências recebidas até D
         - transferências enviadas até D
```

Transferências movimentam os saldos das contas de origem e destino, mas não entram nos totais consolidados de receitas ou despesas. Registros `CANCELED` são ignorados nos saldos e totais, mas permanecem no banco e no histórico de auditoria.

## Data de referência e histórico

`referenceDate` é a data em que o `initialBalance` foi conferido. O domínio rejeita lançamentos e transferências anteriores a essa data, evitando somar um histórico que já esteja embutido no saldo inicial. Para importar um período anterior, primeiro é necessário escolher uma nova data de referência e reconciliar o saldo inicial; essa rotina de migração histórica fica para uma etapa posterior.

Transferências precisam respeitar a data de referência das duas contas. A consulta também não aceita uma data anterior à referência da conta.

## Autorização e correções

- `ADMIN` administra contas, categorias e todas as movimentações.
- `FAMILY` consulta as finanças e pode registrar receitas, despesas e transferências.
- `FAMILY` pode corrigir ou cancelar somente o próprio registro, nas primeiras 24 horas após a criação.
- Depois dessa janela, a correção exige `ADMIN`. O lançamento cancelado é terminal e não pode ser editado.
- Não existe exclusão física como fluxo financeiro. Correções e cancelamentos geram `AuditLog` com ator, entidade, estado anterior e estado seguinte.

Contas e categorias usadas por lançamentos não podem ser removidas pelo banco (`ON DELETE RESTRICT`). Contas e categorias devem ser inativadas quando não puderem mais receber novos registros.

## Migração e implantação

A migração `20261021130000_financial_domain_foundation` somente cria tipos, tabelas, índices, chaves estrangeiras e restrições; ela não insere contas, categorias ou valores financeiros. Em ambientes controlados, aplique-a com:

```sh
npm run db:deploy
```

Não use `prisma db push` em produção e não execute SQL manualmente no PostgreSQL de produção. Faça backup e teste de restauração antes da implantação. Como não há uma migração destrutiva, a reversão operacional segura é restaurar o backup validado ou publicar uma nova migração compensatória; não se deve apagar ou editar o histórico em `_prisma_migrations`.

O dashboard ainda exibe dados demonstrativos nesta fase. A próxima etapa deve conectar uma interface de lançamentos aos serviços do domínio e substituir os cartões demonstrativos gradualmente, sem inserir dados fictícios na base real.
