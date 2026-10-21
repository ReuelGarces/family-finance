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
  createTransferSchema,
  parseDateOnly,
  updateTransferSchema,
} from "../validation";
import { validateTransferReferences } from "./references";

function toActor(user: { id: string; role: "ADMIN" | "FAMILY" }): FinanceActor {
  return { id: user.id, role: user.role };
}

function transferAuditValue(transfer: {
  originAccountId: string;
  destinationAccountId: string;
  amount: Prisma.Decimal;
  transferredOn: Date;
  status: "POSTED" | "CANCELED";
  canceledAt: Date | null;
  canceledById: string | null;
  cancellationReason: string | null;
}) {
  return {
    originAccountId: transfer.originAccountId,
    destinationAccountId: transfer.destinationAccountId,
    amount: decimalToString(transfer.amount),
    transferredOn: transfer.transferredOn.toISOString(),
    status: transfer.status,
    canceledAt: transfer.canceledAt?.toISOString() ?? null,
    canceledById: transfer.canceledById,
    cancellationReason: transfer.cancellationReason,
  };
}

export async function createTransfer(input: unknown) {
  const user = await requireUser();
  const actor = toActor(user);
  assertCanCreateEntry(actor);
  const data = createTransferSchema.parse(input);

  return prisma.$transaction(async (db) => {
    await validateTransferReferences(db, data);

    const transfer = await db.transfer.create({
      data: { ...data, authorId: actor.id },
    });

    await recordAudit(db, {
      actorId: actor.id,
      action: "TRANSFER_CREATED",
      entityType: "Transfer",
      entityId: transfer.id,
      metadata: transferAuditValue(transfer),
    });

    return transfer;
  });
}

export type TransferQuery = {
  accountId?: string;
  from?: Date | string;
  to?: Date | string;
  includeCanceled?: boolean;
};

export async function listTransfers(query: TransferQuery = {}) {
  const user = await requireUser();
  assertCanReadFinance(toActor(user));

  const accountFilter = query.accountId
    ? { OR: [{ originAccountId: query.accountId }, { destinationAccountId: query.accountId }] }
    : undefined;
  const where: Prisma.TransferWhereInput = {
    ...accountFilter,
    status: query.includeCanceled ? undefined : "POSTED",
  };

  if (query.from || query.to) {
    where.transferredOn = {
      gte: query.from ? parseDateOnly(query.from) : undefined,
      lte: query.to ? parseDateOnly(query.to) : undefined,
    };
  }

  return prisma.transfer.findMany({
    where,
    include: {
      originAccount: true,
      destinationAccount: true,
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ transferredOn: "desc" }, { createdAt: "desc" }],
  });
}

export async function updateTransfer(id: string, input: unknown) {
  const user = await requireUser();
  const actor = toActor(user);
  const data = updateTransferSchema.parse(input);

  return prisma.$transaction(async (db) => {
    const existing = await db.transfer.findUnique({ where: { id } });

    if (!existing) {
      throw new FinanceNotFoundError("Transferência não encontrada.");
    }

    assertCanModifyEntry(actor, existing);

    const next = {
      originAccountId: data.originAccountId ?? existing.originAccountId,
      destinationAccountId: data.destinationAccountId ?? existing.destinationAccountId,
      amount: data.amount ?? existing.amount,
      transferredOn: data.transferredOn ?? existing.transferredOn,
    };

    await validateTransferReferences(db, next);

    const transfer = await db.transfer.update({
      where: { id },
      data: next,
    });

    await recordAudit(db, {
      actorId: actor.id,
      action: "TRANSFER_UPDATED",
      entityType: "Transfer",
      entityId: transfer.id,
      metadata: {
        previous: transferAuditValue(existing),
        next: transferAuditValue(transfer),
      },
    });

    return transfer;
  });
}

export async function cancelTransfer(id: string, input: unknown) {
  const user = await requireUser();
  const actor = toActor(user);
  const data = cancelEntrySchema.parse(input);

  return prisma.$transaction(async (db) => {
    const existing = await db.transfer.findUnique({ where: { id } });

    if (!existing) {
      throw new FinanceNotFoundError("Transferência não encontrada.");
    }

    assertCanModifyEntry(actor, existing);

    const transfer = await db.transfer.update({
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
      action: "TRANSFER_CANCELED",
      entityType: "Transfer",
      entityId: transfer.id,
      metadata: {
        previous: transferAuditValue(existing),
        next: transferAuditValue(transfer),
      },
    });

    return transfer;
  });
}
