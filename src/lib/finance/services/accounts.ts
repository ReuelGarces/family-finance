import "server-only";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { recordAudit } from "../audit";
import { assertCanManageCatalog, assertCanReadFinance } from "../authorization";
import { FinanceConflictError, FinanceNotFoundError } from "../errors";
import { decimalToString } from "../money";
import type { FinanceActor } from "../types";
import {
  createFinancialAccountSchema,
  updateFinancialAccountSchema,
} from "../validation";
import type { Prisma } from "@/generated/prisma/client";

function toActor(user: { id: string; role: "ADMIN" | "FAMILY" }): FinanceActor {
  return { id: user.id, role: user.role };
}

export async function listFinancialAccounts() {
  const user = await requireUser();
  assertCanReadFinance(toActor(user));

  return prisma.financialAccount.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function createFinancialAccount(input: unknown) {
  const user = await requireAdmin();
  const actor = toActor(user);
  assertCanManageCatalog(actor);
  const data = createFinancialAccountSchema.parse(input);

  return prisma.$transaction(async (db) => {
    const account = await db.financialAccount.create({ data });

    await recordAudit(db, {
      actorId: actor.id,
      action: "FINANCIAL_ACCOUNT_CREATED",
      entityType: "FinancialAccount",
      entityId: account.id,
      metadata: {
        name: account.name,
        type: account.type,
        initialBalance: decimalToString(account.initialBalance),
        referenceDate: account.referenceDate.toISOString(),
      },
    });

    return account;
  });
}

export async function updateFinancialAccount(id: string, input: unknown) {
  const user = await requireAdmin();
  const actor = toActor(user);
  assertCanManageCatalog(actor);
  const data = updateFinancialAccountSchema.parse(input);

  return prisma.$transaction(async (db) => {
    const existing = await db.financialAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            outgoingTransfers: true,
            incomingTransfers: true,
          },
        },
      },
    });

    if (!existing) {
      throw new FinanceNotFoundError("Conta financeira não encontrada.");
    }

    const hasHistory =
      existing._count.transactions > 0 ||
      existing._count.outgoingTransfers > 0 ||
      existing._count.incomingTransfers > 0;
    const changesOpeningBasis =
      data.initialBalance !== undefined ||
      data.referenceDate !== undefined ||
      data.type !== undefined;

    if (hasHistory && changesOpeningBasis) {
      throw new FinanceConflictError(
        "Saldo inicial, data de referência e tipo não podem ser alterados depois do primeiro registro financeiro.",
      );
    }

    const updateData: Prisma.FinancialAccountUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.initialBalance !== undefined) updateData.initialBalance = data.initialBalance;
    if (data.referenceDate !== undefined) updateData.referenceDate = data.referenceDate;
    if (data.status !== undefined) updateData.status = data.status;

    const account = await db.financialAccount.update({
      where: { id },
      data: updateData,
    });

    await recordAudit(db, {
      actorId: actor.id,
      action: "FINANCIAL_ACCOUNT_UPDATED",
      entityType: "FinancialAccount",
      entityId: account.id,
      metadata: {
        previous: {
          name: existing.name,
          type: existing.type,
          initialBalance: decimalToString(existing.initialBalance),
          referenceDate: existing.referenceDate.toISOString(),
          status: existing.status,
        },
        next: {
          name: account.name,
          type: account.type,
          initialBalance: decimalToString(account.initialBalance),
          referenceDate: account.referenceDate.toISOString(),
          status: account.status,
        },
      },
    });

    return account;
  });
}
