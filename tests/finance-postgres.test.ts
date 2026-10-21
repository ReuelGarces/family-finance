import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

test("persiste valores, relacionamentos, cancelamentos e transferências no PostgreSQL", {
  skip: !testDatabaseUrl,
}, async () => {
  const adapter = new PrismaPg({ connectionString: testDatabaseUrl! });
  const db = new PrismaClient({ adapter });
  const marker = randomUUID();
  let userId = "";
  let otherUserId = "";
  let originAccountId = "";
  let destinationAccountId = "";
  let incomeCategoryId = "";
  let expenseCategoryId = "";
  let transactionId = "";
  let transferId = "";

  try {
    const [user, otherUser] = await Promise.all([
      db.user.create({
        data: {
          email: `family-${marker}@example.test`,
          name: "Usuário de teste",
          passwordHash: "not-a-real-password-hash",
          role: "FAMILY",
        },
      }),
      db.user.create({
        data: {
          email: `admin-${marker}@example.test`,
          name: "Administrador de teste",
          passwordHash: "not-a-real-password-hash",
          role: "ADMIN",
        },
      }),
    ]);
    userId = user.id;
    otherUserId = otherUser.id;

    const [origin, destination] = await Promise.all([
      db.financialAccount.create({
        data: {
          name: `Conta origem ${marker}`,
          type: "BANK",
          initialBalance: new Prisma.Decimal("1000.00"),
          referenceDate: new Date("2026-10-01T00:00:00.000Z"),
        },
      }),
      db.financialAccount.create({
        data: {
          name: `Conta destino ${marker}`,
          type: "CASH",
          initialBalance: new Prisma.Decimal("500.00"),
          referenceDate: new Date("2026-10-01T00:00:00.000Z"),
        },
      }),
    ]);
    originAccountId = origin.id;
    destinationAccountId = destination.id;

    const [incomeCategory, expenseCategory] = await Promise.all([
      db.category.create({ data: { name: `Receita ${marker}`, type: "INCOME" } }),
      db.category.create({ data: { name: `Despesa ${marker}`, type: "EXPENSE" } }),
    ]);
    incomeCategoryId = incomeCategory.id;
    expenseCategoryId = expenseCategory.id;

    const [income, expense] = await Promise.all([
      db.transaction.create({
        data: {
          type: "INCOME",
          amount: new Prisma.Decimal("125.75"),
          description: "Receita de teste",
          accountId: origin.id,
          categoryId: incomeCategory.id,
          occurredOn: new Date("2026-10-02T00:00:00.000Z"),
          authorId: user.id,
        },
      }),
      db.transaction.create({
        data: {
          type: "EXPENSE",
          amount: new Prisma.Decimal("50.25"),
          description: "Despesa de teste",
          accountId: origin.id,
          categoryId: expenseCategory.id,
          occurredOn: new Date("2026-10-03T00:00:00.000Z"),
          authorId: user.id,
        },
      }),
    ]);
    transactionId = income.id;
    assert.equal(expense.amount.toFixed(2), "50.25");

    const transfer = await db.transfer.create({
      data: {
        originAccountId: origin.id,
        destinationAccountId: destination.id,
        amount: new Prisma.Decimal("200.00"),
        transferredOn: new Date("2026-10-04T00:00:00.000Z"),
        authorId: user.id,
      },
    });
    transferId = transfer.id;

    const persisted = await db.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    assert.equal(persisted.amount.toFixed(2), "125.75");
    assert.equal(persisted.status, "POSTED");

    const [incomeTotal, expenseTotal] = await Promise.all([
      db.transaction.aggregate({
        where: { accountId: origin.id, type: "INCOME", status: "POSTED" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { accountId: origin.id, type: "EXPENSE", status: "POSTED" },
        _sum: { amount: true },
      }),
    ]);
    assert.equal(incomeTotal._sum.amount?.toFixed(2), "125.75");
    assert.equal(expenseTotal._sum.amount?.toFixed(2), "50.25");
    assert.equal(transfer.amount.toFixed(2), "200.00");

    await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        canceledById: otherUser.id,
        cancellationReason: "Correção de teste",
      },
    });
    const canceled = await db.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    assert.equal(canceled.status, "CANCELED");
    assert.equal(canceled.canceledById, otherUser.id);

    await assert.rejects(
      db.transaction.create({
        data: {
          type: "EXPENSE",
          amount: new Prisma.Decimal("0.00"),
          description: "Valor inválido",
          accountId: origin.id,
          categoryId: expenseCategory.id,
          occurredOn: new Date("2026-10-05T00:00:00.000Z"),
          authorId: user.id,
        },
      }),
      (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError,
    );
  } finally {
    await db.auditLog.deleteMany({ where: { actorId: { in: [userId, otherUserId] } } });
    if (transactionId) await db.transaction.deleteMany({ where: { id: transactionId } });
    await db.transaction.deleteMany({ where: { accountId: { in: [originAccountId, destinationAccountId] } } });
    if (transferId) await db.transfer.deleteMany({ where: { id: transferId } });
    if (incomeCategoryId || expenseCategoryId) {
      await db.category.deleteMany({ where: { id: { in: [incomeCategoryId, expenseCategoryId].filter(Boolean) } } });
    }
    if (originAccountId || destinationAccountId) {
      await db.financialAccount.deleteMany({ where: { id: { in: [originAccountId, destinationAccountId].filter(Boolean) } } });
    }
    await db.user.deleteMany({ where: { id: { in: [userId, otherUserId].filter(Boolean) } } });
    await db.$disconnect();
  }
});
