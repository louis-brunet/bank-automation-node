export class CaisseDEpargneAdapterInvalidCredentialError extends Error {
  constructor() {
    super('invalid username or password');
  }
}

export class CaisseDEpargneAdapterBalanceNotFoundError extends Error {
  constructor(accountId: string) {
    super(`account balance not found for account with ID '${accountId}'`);
  }
}

export class CaisseDEpargneAdapterParseBalanceError extends Error {
  constructor(accountId: string, balanceText?: string) {
    let message = `count not parse balance for account with ID '${accountId}'`;
    if (balanceText !== undefined) {
      message += `: '${balanceText}'`;
    }
    super(message);
  }
}
