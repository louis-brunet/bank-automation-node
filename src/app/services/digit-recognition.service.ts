import { EasyOCR } from 'node-easyocr';
import { singleton } from 'tsyringe';
import { LoggerService } from '../infra';
import { Logger } from 'pino';
import * as fs from 'node:fs/promises';
import { TemporaryFileService } from '../infra/fs/temporary-file.service';

@singleton()
export class DigitRecognitionService {
  private readonly ocr: EasyOCR = new EasyOCR();
  private readonly logger: Logger;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly temporaryFileService: TemporaryFileService,
  ) {
    this.logger = this.loggerService.getLogger(DigitRecognitionService.name);
  }

  async recognizeDigitFromBase64(base64Image: string): Promise<number | null> {
    const logger = this.loggerService.getChild(
      this.logger,
      this.recognizeDigitFromBase64.name,
    );
    logger.trace({ base64Image });

    try {
      await this.ocr.init(['en']);
      logger.debug('initialized EasyOCR');

      const imageBytes = Buffer.from(base64Image, 'base64');
      const fixedBytes = this._removeBytesAfterIendChunk(imageBytes);

      const result = await this.temporaryFileService.useTemporaryFile(
        async (tempFilePath) => {
          await fs.writeFile(tempFilePath, fixedBytes);
          const candidates = await this.ocr.readText(tempFilePath);

          logger.debug(`candidates ${JSON.stringify(candidates)}`);

          if (candidates.length === 0) {
            return null;
          }

          let result: number;
          const firstCandidate = candidates[0];
          if (typeof firstCandidate === 'string') {
            result = parseInt(firstCandidate, 10);
          } else {
            const errorMessage = `Unexpected type: ${typeof firstCandidate}`;
            throw new Error(errorMessage);
          }

          return result;
        },
      );
      logger.debug({ result });

      throw new Error('todo');
    } catch (e) {
      logger.error(e);
      return null;
    } finally {
      await this.ocr.close();
      logger.info('closed EasyOCR');
    }
  }

  // public recognizeDigitFromBase64(base64String: string): number | null {
  //   const logger = this.logger.getChild('recognizeDigitsFromBase64');
  //
  //   const imageBytes = Buffer.from(base64String, 'base64');
  //   const fixedBytes = this._removeBytesAfterIendChunk(imageBytes);
  //
  //   // const candidates = this.reader.readText(fixedBytes, {
  //   //   detail: 0,
  //   //   allowlist: '0123456789',
  //   //   textThreshold: this.config.textThreshold,
  //   //   lowText: this.config.lowText,
  //   // });
  //
  //   logger.debug(`candidates ${candidates}`);
  //
  //   if (candidates.length === 0) {
  //     return null;
  //   }
  //
  //   let result: number;
  //   const firstCandidate = candidates[0];
  //   if (typeof firstCandidate === 'string') {
  //     result = parseInt(firstCandidate, 10);
  //   } else {
  //     const errorMessage = `Unexpected type: ${typeof firstCandidate}`;
  //     throw new Error(errorMessage);
  //   }
  //
  //   return result;
  // }
  //
  private _removeBytesAfterIendChunk(inputBytes: Buffer): Buffer {
    const logger = this.loggerService.getChild(
      this.logger,
      this._removeBytesAfterIendChunk.name,
    );
    logger.trace({ inputBytes });

    logger.debug(`inputBytes: ${JSON.stringify(inputBytes)}`);

    const iendChunk = Buffer.from(
      '\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82',
    );
    const iendChunkIndex = inputBytes.indexOf(iendChunk);
    logger.debug(`found index ${iendChunkIndex.toString(10)}`);

    // const outputBytes = inputBytes.slice(0, iendChunkIndex + iendChunk.length);
    const outputBytes = inputBytes.subarray(
      0,
      iendChunkIndex + iendChunk.length,
    );
    logger.debug(
      `removed ${(inputBytes.length - outputBytes.length).toString(10)} bytes`,
    );

    return outputBytes;
  }
}

// def recognize_digit_from_base64(self, base64_string: str) -> int | None:
//     logger = self.logger.getChild("recognize_digits_from_base64")
//
//     image_bytes = base64.b64decode(base64_string)
//     fixed_bytes = self._remove_bytes_after_iend_chunk(image_bytes)
//
//     candidates = self.reader.readtext(
//         fixed_bytes,
//         detail=0,
//         allowlist="0123456789",
//         # max_candidates=1,
//         text_threshold=self.config.text_threshold,
//         low_text=self.config.low_text,
//     )
//
//     logger.debug(f"candidates {candidates}")
//
//     if len(candidates) == 0:
//         return None
//
//     result: int
//     first_candidate = candidates[0]
//     if type(first_candidate) is str:
//         result = int(first_candidate)
//     # elif type(first_candidate) is list:
//     #     raise NotImplementedError(f"not implemented for type {type(first_candidate)}")
//     # elif type(first_candidate) is dict:
//     #     raise NotImplementedError(f"not implemented for type {type(first_candidate)}")
//     else:
//         error_message = f"Unexpected type: {type(first_candidate)}"
//         raise ValueError(error_message)
//
//     return result
//
// def _remove_bytes_after_iend_chunk(self, input_bytes: bytes) -> bytes:
//     logger = self.logger.getChild(self._remove_bytes_after_iend_chunk.__name__)
//
//     logger.debug(f"input_bytes: {input_bytes}")
//
//     # iend_chunk = b"\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82"
//     iend_chunk = self.config.iend_chunk
//     iend_chunk_index = input_bytes.index(iend_chunk)
//     logger.debug(f"found index {iend_chunk_index}")
//
//     output_bytes = input_bytes[: iend_chunk_index + len(iend_chunk)]
//     logger.debug(f"removed {len(input_bytes) - len(output_bytes)} bytes")
//
//     return output_bytes
//
