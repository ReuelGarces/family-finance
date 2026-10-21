import { FinanceAuthorizationError } from "./errors";
import type { FinanceActor } from "./types";

export const FAMILY_CORRECTION_WINDOW_MS = 24 * 60 * 60 * 1000;

type EditableEntry = {
  authorId: string;
  createdAt: Date;
  status: "POSTED" | "CANCELED";
};

export function assertCanReadFinance(actor: FinanceActor): void {
  if (actor.role !== "ADMIN" && actor.role !== "FAMILY") {
    throw new FinanceAuthorizationError();
  }
}

export function assertCanManageCatalog(actor: FinanceActor): void {
  if (actor.role !== "ADMIN") {
    throw new FinanceAuthorizationError("Somente o ADMIN pode administrar contas e categorias.");
  }
}

export function assertCanCreateEntry(actor: FinanceActor): void {
  assertCanReadFinance(actor);
}

export function assertCanModifyEntry(
  actor: FinanceActor,
  entry: EditableEntry,
  now = new Date(),
): void {
  if (entry.status !== "POSTED") {
    throw new FinanceAuthorizationError("Lançamentos cancelados não podem ser alterados.");
  }

  if (actor.role === "ADMIN") {
    return;
  }

  const isAuthor = actor.role === "FAMILY" && actor.id === entry.authorId;
  const age = now.getTime() - entry.createdAt.getTime();

  if (!isAuthor || age < 0 || age > FAMILY_CORRECTION_WINDOW_MS) {
    throw new FinanceAuthorizationError(
      "O FAMILY só pode corrigir o próprio lançamento nas primeiras 24 horas; depois disso, solicite ao ADMIN.",
    );
  }
}
