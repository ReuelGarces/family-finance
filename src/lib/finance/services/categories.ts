import "server-only";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { recordAudit } from "../audit";
import { assertCanManageCatalog, assertCanReadFinance } from "../authorization";
import { FinanceConflictError, FinanceNotFoundError } from "../errors";
import type { FinanceActor } from "../types";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validation";
import type { Prisma } from "@/generated/prisma/client";

function toActor(user: { id: string; role: "ADMIN" | "FAMILY" }): FinanceActor {
  return { id: user.id, role: user.role };
}

function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export async function listCategories(type?: "INCOME" | "EXPENSE") {
  const user = await requireUser();
  assertCanReadFinance(toActor(user));

  return prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: [{ status: "asc" }, { type: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(input: unknown) {
  const user = await requireAdmin();
  const actor = toActor(user);
  assertCanManageCatalog(actor);
  const data = createCategorySchema.parse(input);

  return prisma.$transaction(async (db) => {
    const category = await db.category.create({
      data: { ...data, name: normalizeCategoryName(data.name) },
    });

    await recordAudit(db, {
      actorId: actor.id,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category.id,
      metadata: { name: category.name, type: category.type },
    });

    return category;
  });
}

export async function updateCategory(id: string, input: unknown) {
  const user = await requireAdmin();
  const actor = toActor(user);
  assertCanManageCatalog(actor);
  const data = updateCategorySchema.parse(input);

  return prisma.$transaction(async (db) => {
    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });

    if (!existing) {
      throw new FinanceNotFoundError("Categoria não encontrada.");
    }

    if (existing._count.transactions > 0 && data.type !== undefined && data.type !== existing.type) {
      throw new FinanceConflictError(
        "O tipo de uma categoria não pode ser alterado depois de ela ser usada em lançamentos.",
      );
    }

    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined) updateData.name = normalizeCategoryName(data.name);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;

    const category = await db.category.update({ where: { id }, data: updateData });

    await recordAudit(db, {
      actorId: actor.id,
      action: "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: category.id,
      metadata: {
        previous: { name: existing.name, type: existing.type, status: existing.status },
        next: { name: category.name, type: category.type, status: category.status },
      },
    });

    return category;
  });
}
