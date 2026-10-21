import { z } from "zod";
import { OperationType } from "@/generated/prisma/client";
import { FinanceValidationError } from "./errors";
import { parseNonNegativeMoney, parsePositiveMoney } from "./money";

const idSchema = z.string().trim().min(1).max(64);
const nameSchema = z.string().trim().min(1).max(120);
const descriptionSchema = z.string().trim().min(1).max(240);

function transformDateOnly(value: unknown, context: z.RefinementCtx): Date | typeof z.NEVER {
  try {
    return parseDateOnly(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Data inválida.",
    });
    return z.NEVER;
  }
}

export function parseDateOnly(input: unknown): Date {
  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }

  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new FinanceValidationError("Use uma data no formato AAAA-MM-DD.");
  }

  const [year, month, day] = input.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new FinanceValidationError("A data informada não existe.");
  }

  return date;
}

const dateOnlySchema = z.unknown().transform(transformDateOnly);
const positiveMoneySchema = z.unknown().transform((value, context) => {
  try {
    return parsePositiveMoney(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Valor financeiro inválido.",
    });
    return z.NEVER;
  }
});
const nonNegativeMoneySchema = z.unknown().transform((value, context) => {
  try {
    return parseNonNegativeMoney(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Valor financeiro inválido.",
    });
    return z.NEVER;
  }
});

export const createFinancialAccountSchema = z.object({
  name: nameSchema,
  type: z.enum(["BANK", "CASH", "DIGITAL_WALLET", "CREDIT_CARD", "OTHER"]),
  initialBalance: nonNegativeMoneySchema,
  referenceDate: dateOnlySchema,
});

export const updateFinancialAccountSchema = z.object({
  name: nameSchema.optional(),
  type: z.enum(["BANK", "CASH", "DIGITAL_WALLET", "CREDIT_CARD", "OTHER"]).optional(),
  initialBalance: nonNegativeMoneySchema.optional(),
  referenceDate: dateOnlySchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração.");

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum([OperationType.INCOME, OperationType.EXPENSE]),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  type: z.enum([OperationType.INCOME, OperationType.EXPENSE]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração.");

export const createTransactionSchema = z.object({
  type: z.enum([OperationType.INCOME, OperationType.EXPENSE]),
  amount: positiveMoneySchema,
  description: descriptionSchema,
  accountId: idSchema,
  categoryId: idSchema,
  occurredOn: dateOnlySchema,
});

export const updateTransactionSchema = z.object({
  type: z.enum([OperationType.INCOME, OperationType.EXPENSE]).optional(),
  amount: positiveMoneySchema.optional(),
  description: descriptionSchema.optional(),
  accountId: idSchema.optional(),
  categoryId: idSchema.optional(),
  occurredOn: dateOnlySchema.optional(),
}).refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração.");

export const cancelEntrySchema = z.object({
  reason: z.string().trim().min(1).max(240),
});

export const createTransferSchema = z.object({
  originAccountId: idSchema,
  destinationAccountId: idSchema,
  amount: positiveMoneySchema,
  transferredOn: dateOnlySchema,
});

export const updateTransferSchema = z.object({
  originAccountId: idSchema.optional(),
  destinationAccountId: idSchema.optional(),
  amount: positiveMoneySchema.optional(),
  transferredOn: dateOnlySchema.optional(),
}).refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração.");

export type CreateFinancialAccountInput = z.infer<typeof createFinancialAccountSchema>;
export type UpdateFinancialAccountInput = z.infer<typeof updateFinancialAccountSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
