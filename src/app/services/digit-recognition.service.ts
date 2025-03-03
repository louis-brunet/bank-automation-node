import fs from 'node:fs/promises';
import { Logger } from 'pino';
import Tesseract, { createWorker, type Worker } from 'tesseract.js';
import { Disposable, singleton } from 'tsyringe';
import { LoggerService, TemporaryFileService } from '../infra';

const MAP_CHARACHER_TO_DIGIT: Record<string, string> = {
  '|': '1',
};

@singleton()
export class DigitRecognitionService implements Disposable {
  private readonly logger: Logger;
  private worker: Worker | undefined = undefined;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly temporaryFileService: TemporaryFileService,
  ) {
    this.logger = this.loggerService.getLogger(DigitRecognitionService.name);
  }

  // async [Symbol.asyncDispose](): Promise<void> {
  //   await this.worker?.terminate();
  //   this.worker = undefined;
  // }

  async dispose() {
    const logger = this.loggerService.getChild(this.logger, this.dispose.name);
    logger.trace('called');
    // await this[Symbol.asyncDispose]();
    await this.worker?.terminate();
    this.worker = undefined;
  }

  async recognizeDigitFromBase64(base64Image: string): Promise<number | null> {
    const logger = this.loggerService.getChild(
      this.logger,
      this.recognizeDigitFromBase64.name,
    );
    logger.trace({ base64Image });

    try {
      const worker = await this.getWorker();
      const imageBytes = Buffer.from(base64Image, 'base64');
      // const fixedBytes = this._removeBytesAfterIendChunk(imageBytes);
      // const result = await worker.recognize(fixedBytes, {});
      const result = await this.temporaryFileService.useTemporaryFile(
        async (tempFilePath) => {
          await fs.writeFile(tempFilePath, imageBytes);
          const result = await worker.recognize(tempFilePath, {});
          return result;
          // return await Promise.resolve({ data: { text: '0' } });
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

  private async getWorker() {
    if (!this.worker) {
      // this.worker = await createWorker('eng', Tesseract.OEM.DEFAULT, {
      //   logger: this.logger.debug,
      // });
      this.worker = await createWorker('eng');
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789|',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
      });
    }
    return this.worker;
  }
}
