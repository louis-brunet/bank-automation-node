export class CaisseDEpargneAdapterInvalidCredentialError extends Error {
  constructor() {
    super('invalid username or password');
  }
}
