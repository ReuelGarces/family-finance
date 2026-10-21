export type FinanceRole = "ADMIN" | "FAMILY";

export type FinanceActor = {
  id: string;
  role: FinanceRole;
};

export type DateOnlyInput = Date | string;

export type MoneyInput = string;
