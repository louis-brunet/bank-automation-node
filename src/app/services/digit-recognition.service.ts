import fs from 'node:fs/promises';
import { Logger } from 'pino';
import Tesseract, {
  createScheduler,
  createWorker,
  Scheduler,
} from 'tesseract.js';
import { Disposable, Lifecycle, scoped } from 'tsyringe';
import { LoggerService, TemporaryFileService } from '../infra';

const MAP_CHARACHER_TO_DIGIT: Record<string, string> = {
  '|': '1',
};

@scoped(Lifecycle.ContainerScoped)
export class DigitRecognitionService implements Disposable {
  private readonly logger: Logger;
  private scheduler: Scheduler | undefined = undefined;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly temporaryFileService: TemporaryFileService,
  ) {
    this.logger = this.loggerService.getLogger(DigitRecognitionService.name);
  }

  async dispose() {
    const logger = this.loggerService.getChild(this.logger, this.dispose.name);
    await this.scheduler?.terminate();
    logger.trace('disposed');
  }

  async recognizeDigitFromBase64(base64Image: string): Promise<number | null> {
    const logger = this.loggerService.getChild(
      this.logger,
      this.recognizeDigitFromBase64.name,
    );
    logger.trace({ base64Image });

    try {
      const imageBytes = Buffer.from(base64Image, 'base64');
      const result = await this.temporaryFileService.useTemporaryFile(
        async (tempFilePath) => {
          await fs.writeFile(tempFilePath, imageBytes);
          const result = await this.recognize(tempFilePath, {});
          return result;
        },
      );
      logger.debug({ result });
      const resultText = result.data.text;
      return this.getDigitFromResultString(resultText);
    } catch (e) {
      logger.error(e);
      return null;
    }
  }

  private getDigitFromResultString(resultText: string): number {
    const resultChar = resultText[0];
    if (!resultChar) {
      throw new Error('empty result');
    }
    const mapped = MAP_CHARACHER_TO_DIGIT[resultChar] ?? resultChar;
    const parsed = parseInt(mapped, 10);
    if (!Number.isInteger(parsed)) {
      throw new Error('not an integer');
    }
    return parsed;
  }

  private async createWorker() {
    const workerLogger = this.loggerService.getChild(this.logger, 'WORKER');
    const worker = await createWorker('eng', Tesseract.OEM.DEFAULT, {
      logger: (msg) => {
        workerLogger.debug(JSON.stringify(msg));
      },
    });
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789|',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
    });
    return worker;
  }

  private async recognize(
    image: Tesseract.ImageLike,
    options: Partial<Tesseract.RecognizeOptions>,
  ) {
    if (!this.scheduler) {
      this.scheduler = createScheduler();
    }
    if (this.scheduler.getQueueLen() + 1 > 2 * this.scheduler.getNumWorkers()) {
      const newWorker = await this.createWorker();
      this.scheduler.addWorker(newWorker);
    }
    return await this.scheduler.addJob('recognize', image, options);
  }
}
