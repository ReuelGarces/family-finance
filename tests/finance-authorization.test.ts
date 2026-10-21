import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCanCreateEntry,
  assertCanManageCatalog,
  assertCanModifyEntry,
  assertCanReadFinance,
} from "../src/lib/finance/authorization";
import { FinanceAuthorizationError } from "../src/lib/finance/errors";

const admin = { id: "admin-id", role: "ADMIN" as const };
const family = { id: "family-id", role: "FAMILY" as const };
const ownRecentEntry = {
  authorId: family.id,
  createdAt: new Date(Date.now() - 60 * 60 * 1000),
  status: "POSTED" as const,
};

test("ADMIN e FAMILY podem consultar e registrar movimentações", () => {
  assert.doesNotThrow(() => assertCanReadFinance(admin));
  assert.doesNotThrow(() => assertCanReadFinance(family));
  assert.doesNotThrow(() => assertCanCreateEntry(admin));
  assert.doesNotThrow(() => assertCanCreateEntry(family));
});

test("somente ADMIN administra o catálogo financeiro", () => {
  assert.doesNotThrow(() => assertCanManageCatalog(admin));
  assert.throws(() => assertCanManageCatalog(family), FinanceAuthorizationError);
});

test("FAMILY pode corrigir somente o próprio registro dentro da janela de 24 horas", () => {
  assert.doesNotThrow(() => assertCanModifyEntry(family, ownRecentEntry));
  assert.doesNotThrow(() => assertCanModifyEntry(admin, {
    ...ownRecentEntry,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  }));

  assert.throws(() => assertCanModifyEntry(family, {
    ...ownRecentEntry,
    authorId: "another-family-id",
  }), FinanceAuthorizationError);
  assert.throws(() => assertCanModifyEntry(family, {
    ...ownRecentEntry,
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
  }), FinanceAuthorizationError);
  assert.throws(() => assertCanModifyEntry(family, {
    ...ownRecentEntry,
    status: "CANCELED",
  }), FinanceAuthorizationError);
});
