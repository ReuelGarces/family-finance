import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "../audit";
import {
  assertCanCreateEntry,
  assertCanModifyEntry,
  assertCanReadFinance,
} from "../authorization";
import { FinanceNotFoundError } from "../errors";
import { decimalToString } from "../money";
import type { FinanceActor } from "../types";
import {
  cancelEntrySchema,
  createTransactionSchema,
  parseDateOnly,
  updateTransactionSchema,
} from "../validation";
import { validateTransactionReferences } from "./references";

function toActor(user: { id: string; role: "ADMIN" | "FAMILY" }): FinanceActor {
  return { id: user.id, role: user.role };
}

function transactionAuditValue(transaction: {
  type: "INCOME" | "EXPENSE";
  amount: Prisma.Decimal;
  description: string;
  accountId: string;
  categoryId: string;
  occurredOn: Date;
  status: "POSTED" | "CANCELED";
  canceledAt: Date | null;
  canceledById: string | null;
  cancellationReason: string | null;
}) {
  return {
    type: transaction.type,
    amount: decimalToString(transaction.amount),
    description: transaction.description,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    occurredOn: transaction.occurredOn.toISOString(),
    status: transaction.status,
    canceledAt: transaction.canceledAt?.toISOString() ?? null,
    canceledById: transaction.canceledById,
    cancellationReason: transaction.cancellationReason,
  };
}

export async function createTransaction(input: unknown) {
  const user = await requireUser();
  const actor = toActor(user);
  assertCanCreateEntry(actor);
  const data = createTransactionSchema.parse(input);

  return prisma.$transaction(async (db) => {
    await validateTransactionReferences(db, data);

    const transaction = await db.transaction.create({
      data: { ...data, authorId: actor.id },
    });

    await recordAudit(db, {
      actorId: actor.id,
      action: "TRANSACTION_CREATED",
      entityType: "Transaction",
      entityId: transaction.id,
      metadata: transactionAuditValue(transaction),
    });

    return transaction;
  });
}

export type TransactionQuery = {
  accountId?: string;
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
  from?: Date | string;
  to?: Date | string;
  includeCanceled?: boolean;
};

export async function listTransactions(query: TransactionQuery = {}) {
  const user = await requireUser();
  assertCanReadFinance(toActor(user));

  const where: Prisma.TransactionWhereInput = {
    accountId: query.accountId,
    categoryId: query.categoryId,
    type: query.type,
    status: query.includeCanceled ? undefined : "POSTED",
  };

  if (query.from || query.to) {
    where.occurredOn = {
      gte: query.from ? parseDateOnly(query.from) : undefined,
      lte: query.to ? parseDateOnly(query.to) : undefined,
    };
  }

  return prisma.transaction.findMany({
    where,
    include: {
      account: true,
      category: true,
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
  });
}

export async function updateTransaction(id: string, input: unknown) {
  const user = await requireUser();
  const actor = toActor(user);
  const data = updateTransactionSchema.parse(input);

  return prisma.$transaction(async (db) => {
    const existing = await db.transaction.findUnique({ where: { id } });

    if (!existing) {
      throw new FinanceNotFoundError("Lançamento não encontrado.");
    }

    assertCanModifyEntry(actor, existing);

    const next = {
      type: data.type ?? existing.type,
      amount: data.amount ?? existing.amount,
      description: data.description ?? existing.description,
      accountId: data.accountId ?? existing.accountId,
      categoryId: data.categoryId ?? existing.categoryId,
      occurredOn: data.occurredOn ?? existing.occurredOn,
    };

    await validateTransactionReferences(db, next);

    const transaction = await db.transaction.update({
      where: { id },
      data: next,
    });

    await recordAudit(db, {
      actorId: actor.id,
      action: "TRANSACTION_UPDATED",
      entityType: "Transaction",
      entityId: transaction.id,
      metadata: {
        previous: transactionAuditValue(existing),
        next: transactionAuditValue(transaction),
      },
    });

    return transaction;
  });
}

export async function cancelTransaction(id: string, input: unknown) {
  const user = await requireUser();
  const actor = toActor(user);
  const data = cancelEntrySchema.parse(input);

  return prisma.$transaction(async (db) => {
    const existing = await db.transaction.findUnique({ where: { id } });

    if (!existing) {
      throw new FinanceNotFoundError("Lançamento não encontrado.");
    }

    assertCanModifyEntry(actor, existing);

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        canceledById: actor.id,
        cancellationReason: data.reason,
      },
    });

    await recordAudit(db, {
      actorId: actor.id,
      action: "TRANSACTION_CANCELED",
      entityType: "Transaction",
      entityId: transaction.id,
      metadata: {
        previous: transactionAuditValue(existing),
        next: transactionAuditValue(transaction),
      },
    });

    return transaction;
  });
}
