import '@abraham/reflection';
import { container, DependencyContainer } from 'tsyringe';
import {
  BankAutomationService,
  LoggerService,
  PROCESS_ENV_SYMBOL,
} from './app';

function configureDependencies(container: DependencyContainer) {
  container.register(PROCESS_ENV_SYMBOL, { useValue: process.env });
}

async function main() {
  configureDependencies(container);

  const loggerService = container.resolve(LoggerService);
  const logger = loggerService.getLogger(main.name);
  try {
    const service = container.resolve(BankAutomationService);
    await service.updateAccountBalances();
  } catch (e) {
    logger.error(e);
  } finally {
    await container.dispose();
    logger.info('Disposable instances disposed');
  }
}

main()
  .then(() => {
    console.log('Done');
  })
  .catch(console.error);
