import { Prisma } from "@/generated/prisma/client";

export type DecimalValue = Prisma.Decimal;
export type DecimalInput = DecimalValue | string;

const MONEY_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;

function parseMoney(input: unknown, allowZero: boolean): DecimalValue {
  if (typeof input !== "string") {
    throw new TypeError("Valores financeiros devem ser informados como texto decimal.");
  }

  const value = input.trim();

  if (!MONEY_PATTERN.test(value)) {
    throw new TypeError("Use até 12 algarismos inteiros e, opcionalmente, dois centavos.");
  }

  const decimal = new Prisma.Decimal(value);

  if (!decimal.isFinite() || decimal.isNegative() || (!allowZero && decimal.isZero())) {
    throw new TypeError(allowZero ? "O valor não pode ser negativo." : "O valor deve ser maior que zero.");
  }

  return decimal.toDecimalPlaces(2);
}

export function parsePositiveMoney(input: unknown): DecimalValue {
  return parseMoney(input, false);
}

export function parseNonNegativeMoney(input: unknown): DecimalValue {
  return parseMoney(input, true);
}

export function toDecimal(input: DecimalInput): DecimalValue {
  if (typeof input === "string") {
    return parseNonNegativeMoney(input);
  }

  return new Prisma.Decimal(input.toFixed(2));
}

export function decimalToString(input: DecimalInput): string {
  return toDecimal(input).toFixed(2);
}

export function addMoney(...values: DecimalInput[]): DecimalValue {
  return values.reduce<DecimalValue>(
    (total, value) => total.plus(toDecimal(value)),
    new Prisma.Decimal("0.00"),
  );
}

export function subtractMoney(left: DecimalInput, right: DecimalInput): DecimalValue {
  return toDecimal(left).minus(toDecimal(right));
}

export function calculateOperationTotals(
  entries: Array<{ type: "INCOME" | "EXPENSE"; amount: DecimalInput }>,
): { income: DecimalValue; expense: DecimalValue } {
  return entries.reduce(
    (totals, entry) => {
      if (entry.type === "INCOME") {
        totals.income = totals.income.plus(toDecimal(entry.amount));
      } else {
        totals.expense = totals.expense.plus(toDecimal(entry.amount));
      }

      return totals;
    },
    { income: new Prisma.Decimal("0.00"), expense: new Prisma.Decimal("0.00") },
  );
}

export function calculateAccountBalance(input: {
  initialBalance: DecimalInput;
  income: DecimalInput;
  expense: DecimalInput;
  transfersIn: DecimalInput;
  transfersOut: DecimalInput;
}): DecimalValue {
  return toDecimal(input.initialBalance)
    .plus(toDecimal(input.income))
    .minus(toDecimal(input.expense))
    .plus(toDecimal(input.transfersIn))
    .minus(toDecimal(input.transfersOut));
}
