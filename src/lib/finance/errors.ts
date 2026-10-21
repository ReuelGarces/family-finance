export class FinanceValidationError extends Error {
  readonly code = "FINANCE_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "FinanceValidationError";
  }
}

export class FinanceAuthorizationError extends Error {
  readonly code = "FINANCE_FORBIDDEN";

  constructor(message = "Você não tem permissão para realizar esta operação financeira.") {
    super(message);
    this.name = "FinanceAuthorizationError";
  }
}

export class FinanceNotFoundError extends Error {
  readonly code = "FINANCE_NOT_FOUND";

  constructor(message = "Registro financeiro não encontrado.") {
    super(message);
    this.name = "FinanceNotFoundError";
  }
}

export class FinanceConflictError extends Error {
  readonly code = "FINANCE_CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "FinanceConflictError";
  }
}
