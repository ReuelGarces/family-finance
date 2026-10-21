import assert from "node:assert/strict";
import test from "node:test";
import {
  addMoney,
  calculateAccountBalance,
  calculateOperationTotals,
  decimalToString,
  parseNonNegativeMoney,
  parsePositiveMoney,
} from "../src/lib/finance/money";
import { createTransactionSchema } from "../src/lib/finance/validation";

test("mantém centavos sem aritmética de ponto flutuante", () => {
  assert.equal(decimalToString(addMoney("0.10", "0.20")), "0.30");
  assert.equal(decimalToString(parsePositiveMoney("1234567890.99")), "1234567890.99");
  assert.equal(decimalToString(parseNonNegativeMoney("0.00")), "0.00");
});

test("rejeita valores negativos, zero e formatos financeiros inválidos", () => {
  for (const value of ["0", "0.00", "-1.00", "1.001", "1,00", "1e2", 10]) {
    assert.throws(() => parsePositiveMoney(value));
  }

  assert.throws(() => createTransactionSchema.parse({
    type: "EXPENSE",
    amount: 10.5,
    description: "Teste",
    accountId: "account",
    categoryId: "category",
    occurredOn: "2026-10-21",
  }));
});

test("calcula saldo inicial + receitas - despesas + transferências", () => {
  const balance = calculateAccountBalance({
    initialBalance: "1000.00",
    income: "250.75",
    expense: "100.25",
    transfersIn: "50.00",
    transfersOut: "10.00",
  });

  assert.equal(decimalToString(balance), "1190.50");
});

test("transferências compensadas alteram contas, mas não receitas ou despesas", () => {
  const accountBeforeTransfer = calculateAccountBalance({
    initialBalance: "1000.00",
    income: "200.00",
    expense: "50.00",
    transfersIn: "0.00",
    transfersOut: "0.00",
  });
  const accountAfterTransfer = calculateAccountBalance({
    initialBalance: "1000.00",
    income: "200.00",
    expense: "50.00",
    transfersIn: "100.00",
    transfersOut: "100.00",
  });

  assert.equal(decimalToString(accountBeforeTransfer), decimalToString(accountAfterTransfer));
  const totals = calculateOperationTotals([
    { type: "INCOME", amount: "200.00" },
    { type: "EXPENSE", amount: "50.00" },
  ]);

  assert.equal(decimalToString(totals.income), "200.00");
  assert.equal(decimalToString(totals.expense), "50.00");
});
