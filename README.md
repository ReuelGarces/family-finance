# Family Finance

Sistema privado de organização financeira familiar, com dashboard responsivo e preparado para PostgreSQL e implantação em Coolify.

> O dashboard atual é somente uma prévia visual. Todos os valores são fictícios; não há registros reais da família no repositório.

## O que esta primeira etapa entrega

- Login por e-mail e senha, sem cadastro público.
- Papéis `ADMIN` e `FAMILY`, com rotas do painel protegidas no servidor.
- Senhas armazenadas com hash bcrypt; cinco tentativas incorretas bloqueiam a conta por 15 minutos.
- Sessões Auth.js com duração de até oito horas.
- PostgreSQL, Prisma ORM, migração inicial e criação controlada das duas contas.
- Fundação do domínio financeiro com contas, categorias, lançamentos, transferências, saldos `Decimal(14,2)` e auditoria transacional.
- Dashboard escuro inspirado na referência visual, com gráficos demonstrativos.
- Dockerfile multi-stage, healthcheck e volume persistente no Compose local.

O dashboard continua demonstrativo nesta etapa; os serviços financeiros estão preparados para a próxima etapa de interface e não inserem valores fictícios. Contas recorrentes, dívidas, conciliação histórica e relatórios serão adicionados posteriormente.

As fórmulas de saldo, a política de correção do usuário `FAMILY`, o tratamento da data de referência e o procedimento de migração estão documentados em [`docs/financial-domain.md`](docs/financial-domain.md).

## Desenvolvimento local

Requisitos: Node.js 24 ou superior e Docker Compose.

1. Copie `.env.example` para `.env`.
2. Troque todos os valores de exemplo. Gere `AUTH_SECRET` com `openssl rand -base64 32` e escolha senhas únicas e fortes para as duas contas.
3. Para executar o app com `npm run dev`, use em `DATABASE_URL` o endereço `localhost`. O banco do Compose fica disponível apenas localmente na porta 5432.
4. Instale as dependências e inicialize o banco:

```sh
npm ci
docker compose up -d db
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

A aplicação ficará em `http://localhost:3000`. A primeira execução cria as contas definidas por `INITIAL_ADMIN_*` e `INITIAL_FAMILY_*`. O seed é idempotente: se já existir uma conta de cada papel, ele preserva essas contas e não altera suas senhas.

## Testar o container completo

Com as variáveis preenchidas no arquivo privado `.env`, execute:

```sh
docker compose up --build
```

O container aplica as migrações, cria as contas iniciais ausentes e só então inicia o servidor. O Compose mantém os dados do PostgreSQL no volume `family_finance_pgdata`.

## Implantação no Coolify

- Construa a aplicação pelo `Dockerfile` ou use o Compose deste repositório.
- Configure `DATABASE_URL` apontando para o PostgreSQL na rede privada do Coolify. Não exponha a porta do banco à internet.
- Configure `AUTH_SECRET`, `AUTH_URL` e as variáveis `INITIAL_*` para a primeira inicialização.
- Aponte o domínio para a porta 3000. O app fornece `GET /api/health`, que confere a conexão com o banco.
- Configure um volume persistente para o diretório de dados do PostgreSQL e backups agendados. Faça um teste de restauração antes de confiar no backup.
- Depois que as duas contas forem criadas, remova as variáveis `INITIAL_*` do ambiente de produção.

Não publique senhas, `AUTH_SECRET`, URLs privadas com senha, saldos ou dados pessoais em commits, issues, screenshots ou logs. `.env` está no `.gitignore`; mantenha as credenciais reais somente no ambiente privado de implantação.

## Estrutura

- `src/app`: rotas do App Router, login, painel e healthcheck.
- `src/lib/auth`: validação de credenciais e autorização no servidor.
- `src/lib/finance`: validação monetária, autorização, auditoria e serviços do domínio financeiro.
- `prisma`: modelos, migrações e seed sem dados financeiros fictícios.
- `tests`: regras monetárias, autorização e persistência PostgreSQL.
- `src/components/dashboard`: dashboard e gráficos de demonstração.
- `scripts/start.sh`: migrações e seed antes de iniciar o container.

## Verificações

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

A variável `DATABASE_URL` precisa estar definida para gerar o Prisma Client durante o build.
