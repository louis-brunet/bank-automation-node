import '@abraham/reflection';
import { container, DependencyContainer } from 'tsyringe';
import {
  CaisseDEpargneAdapter,
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
    // const config = container.resolve(CaisseDEpargneConfig);
    //
    const adapter = container.resolve(CaisseDEpargneAdapter);
    const balance = await adapter.getCheckingAccountBalance();
    logger.info({ balance });
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
