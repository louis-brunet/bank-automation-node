import { Lifecycle, scoped } from 'tsyringe';
import { LoggerService } from '../infra';
import { Logger } from 'pino';
import { CaisseDEpargneAdapter } from '../adapters';
import { StorageService } from './storage.service';

@scoped(Lifecycle.ContainerScoped)
export class BankAutomationService {
  private readonly logger: Logger;

  constructor(
    private readonly loggerService: LoggerService,
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
    const balance =
      await this.caisseDEpargneAdapter.getCheckingAccountBalance();
    logger.info({ balance });

    await this.storageService.setCheckingAccountBalance(balance);

    logger.warn('TODO');
    throw new Error('todo');
  }
}
