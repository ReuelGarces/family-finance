import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { Prisma } from "@/generated/prisma/client";
import { assertCanReadFinance } from "../authorization";
import { FinanceConflictError, FinanceNotFoundError } from "../errors";
import {
  calculateAccountBalance,
  calculateOperationTotals,
  decimalToString,
} from "../money";
import type { FinanceActor } from "../types";
import { parseDateOnly } from "../validation";

function toActor(user: { id: string; role: "ADMIN" | "FAMILY" }): FinanceActor {
  return { id: user.id, role: user.role };
}

function sumAmounts(records: Array<{ amount: Prisma.Decimal }>): Prisma.Decimal {
  return records.reduce(
    (total, record) => total.plus(record.amount),
    new Prisma.Decimal("0.00"),
  );
}

function assertAsOfOnOrAfterReferenceDate(referenceDate: Date, asOf: Date): void {
  if (asOf.getTime() < referenceDate.getTime()) {
    throw new FinanceConflictError(
      "A consulta não pode ser anterior à data de referência da conta.",
    );
  }
}

export async function getAccountBalance(accountId: string, asOfInput?: Date | string) {
  const user = await requireUser();
  assertCanReadFinance(toActor(user));
  const account = await prisma.financialAccount.findUnique({ where: { id: accountId } });

  if (!account) {
    throw new FinanceNotFoundError("Conta financeira não encontrada.");
  }

  const asOf = asOfInput ? parseDateOnly(asOfInput) : new Date();
  const asOfDate = parseDateOnly(asOf);
  assertAsOfOnOrAfterReferenceDate(account.referenceDate, asOfDate);

  const [transactions, outgoingTransfers, incomingTransfers] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        accountId,
        status: "POSTED",
        occurredOn: { gte: account.referenceDate, lte: asOfDate },
      },
      select: { type: true, amount: true },
    }),
    prisma.transfer.findMany({
      where: {
        originAccountId: accountId,
        status: "POSTED",
        transferredOn: { gte: account.referenceDate, lte: asOfDate },
      },
      select: { amount: true },
    }),
    prisma.transfer.findMany({
      where: {
        destinationAccountId: accountId,
        status: "POSTED",
        transferredOn: { gte: account.referenceDate, lte: asOfDate },
      },
      select: { amount: true },
    }),
  ]);

  const income = sumAmounts(transactions.filter((item) => item.type === "INCOME"));
  const expense = sumAmounts(transactions.filter((item) => item.type === "EXPENSE"));
  const transfersIn = sumAmounts(incomingTransfers);
  const transfersOut = sumAmounts(outgoingTransfers);
  const balance = calculateAccountBalance({
    initialBalance: account.initialBalance,
    income,
    expense,
    transfersIn,
    transfersOut,
  });

  return {
    accountId: account.id,
    asOf: asOfDate,
    initialBalance: decimalToString(account.initialBalance),
    income: decimalToString(income),
    expense: decimalToString(expense),
    transfersIn: decimalToString(transfersIn),
    transfersOut: decimalToString(transfersOut),
    balance: decimalToString(balance),
  };
}

export async function getConsolidatedSummary(asOfInput?: Date | string) {
  const user = await requireUser();
  assertCanReadFinance(toActor(user));
  const asOf = parseDateOnly(asOfInput ?? new Date());

  const [accounts, transactions, transfers] = await Promise.all([
    prisma.financialAccount.findMany({ orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: { status: "POSTED", occurredOn: { lte: asOf } },
      select: { accountId: true, type: true, amount: true, occurredOn: true },
    }),
    prisma.transfer.findMany({
      where: { status: "POSTED", transferredOn: { lte: asOf } },
      select: {
        originAccountId: true,
        destinationAccountId: true,
        amount: true,
        transferredOn: true,
      },
    }),
  ]);

  let totalIncome = new Prisma.Decimal("0.00");
  let totalExpense = new Prisma.Decimal("0.00");
  let consolidatedBalance = new Prisma.Decimal("0.00");

  for (const account of accounts) {
    assertAsOfOnOrAfterReferenceDate(account.referenceDate, asOf);

    const accountTransactions = transactions.filter(
      (item) =>
        item.accountId === account.id &&
        item.occurredOn.getTime() >= account.referenceDate.getTime(),
    );
    const { income: accountIncome, expense: accountExpense } = calculateOperationTotals(accountTransactions);
    const accountTransfersIn = sumAmounts(
      transfers.filter(
        (item) =>
          item.destinationAccountId === account.id &&
          item.transferredOn.getTime() >= account.referenceDate.getTime(),
      ),
    );
    const accountTransfersOut = sumAmounts(
      transfers.filter(
        (item) =>
          item.originAccountId === account.id &&
          item.transferredOn.getTime() >= account.referenceDate.getTime(),
      ),
    );

    totalIncome = totalIncome.plus(accountIncome);
    totalExpense = totalExpense.plus(accountExpense);
    consolidatedBalance = consolidatedBalance.plus(
      calculateAccountBalance({
        initialBalance: account.initialBalance,
        income: accountIncome,
        expense: accountExpense,
        transfersIn: accountTransfersIn,
        transfersOut: accountTransfersOut,
      }),
    );
  }

  return {
    asOf,
    income: decimalToString(totalIncome),
    expense: decimalToString(totalExpense),
    netChange: decimalToString(totalIncome.minus(totalExpense)),
    consolidatedBalance: decimalToString(consolidatedBalance),
    accountCount: accounts.length,
  };
}
