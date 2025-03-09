import { delay, inject, Lifecycle, scoped } from 'tsyringe';
import { LoggerService } from '../infra';
import { Logger } from 'pino';
import { CaisseDEpargneAdapter } from '../adapters';
import { StorageService } from './storage.service';

@scoped(Lifecycle.ContainerScoped)
export class BankAutomationService {
  private readonly logger: Logger;

  constructor(
    private readonly loggerService: LoggerService,
    @inject(delay(() => CaisseDEpargneAdapter))
    private readonly caisseDEpargneAdapter: CaisseDEpargneAdapter,
    private readonly storageService: StorageService,
  ) {
    this.logger = this.loggerService.getLogger(BankAutomationService.name);
    this.logger.trace('constructor called');
  }

  async updateAccountBalances() {
    const logger = this.loggerService.getChild(
      this.logger,
      this.updateAccountBalances.name,
    );
    const balances = await this.caisseDEpargneAdapter.getAccountBalances();
    logger.info({ balances });

    await this.storageService.setCheckingAccountBalance(
      balances.checkingAccountBalance,
    );

    await this.storageService.setLivretAAccountBalance(
      balances.livretAAccountBalance,
    );

    await this.storageService.setLivretJeuneAccountBalance(
      balances.livretJeuneAccountBalance,
    );
  }
}
