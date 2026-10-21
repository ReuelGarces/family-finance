import type { Prisma } from "@/generated/prisma/client";
import {
  FinanceConflictError,
  FinanceNotFoundError,
} from "../errors";

function assertOnOrAfterReferenceDate(referenceDate: Date, eventDate: Date): void {
  if (eventDate.getTime() < referenceDate.getTime()) {
    throw new FinanceConflictError(
      "A data do lançamento precisa ser igual ou posterior à data de referência da conta.",
    );
  }
}

export async function validateTransactionReferences(
  db: Prisma.TransactionClient,
  input: {
    accountId: string;
    categoryId: string;
    type: "INCOME" | "EXPENSE";
    occurredOn: Date;
  },
) {
  const [account, category] = await Promise.all([
    db.financialAccount.findUnique({ where: { id: input.accountId } }),
    db.category.findUnique({ where: { id: input.categoryId } }),
  ]);

  if (!account) {
    throw new FinanceNotFoundError("Conta financeira não encontrada.");
  }

  if (!category) {
    throw new FinanceNotFoundError("Categoria não encontrada.");
  }

  if (account.status !== "ACTIVE") {
    throw new FinanceConflictError("A conta financeira não está ativa.");
  }

  if (category.status !== "ACTIVE") {
    throw new FinanceConflictError("A categoria não está ativa.");
  }

  if (category.type !== input.type) {
    throw new FinanceConflictError("O tipo da categoria precisa corresponder ao tipo do lançamento.");
  }

  assertOnOrAfterReferenceDate(account.referenceDate, input.occurredOn);

  return { account, category };
}

export async function validateTransferReferences(
  db: Prisma.TransactionClient,
  input: {
    originAccountId: string;
    destinationAccountId: string;
    transferredOn: Date;
  },
) {
  if (input.originAccountId === input.destinationAccountId) {
    throw new FinanceConflictError("A origem e o destino da transferência precisam ser contas diferentes.");
  }

  const [originAccount, destinationAccount] = await Promise.all([
    db.financialAccount.findUnique({ where: { id: input.originAccountId } }),
    db.financialAccount.findUnique({ where: { id: input.destinationAccountId } }),
  ]);

  if (!originAccount || !destinationAccount) {
    throw new FinanceNotFoundError("As duas contas da transferência precisam existir.");
  }

  if (originAccount.status !== "ACTIVE" || destinationAccount.status !== "ACTIVE") {
    throw new FinanceConflictError("As duas contas da transferência precisam estar ativas.");
  }

  assertOnOrAfterReferenceDate(originAccount.referenceDate, input.transferredOn);
  assertOnOrAfterReferenceDate(destinationAccount.referenceDate, input.transferredOn);

  return { originAccount, destinationAccount };
}
