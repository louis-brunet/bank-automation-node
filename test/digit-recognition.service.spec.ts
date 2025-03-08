import './setup';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, TestContext } from 'node:test';
import { DigitRecognitionService, TemporaryFileService } from '../src';
import { createUnitTestSuite } from './shared';

function base64EncodeFile(filePath: string): string {
  // Read the file
  const fileData = fs.readFileSync(filePath);
  // Convert the file data to base64
  return fileData.toString('base64');
}

void createUnitTestSuite(DigitRecognitionService, async (context) => {
  await describe('recognizeDigitFromBase64', {}, async () => {
    await it('is defined', (t: TestContext) => {
      t.assert.ok(!!context.getTestClass().recognizeDigitFromBase64);
    });

    await it(
      'reconizes sample digits',
      { plan: 10 },
      async (t: TestContext) => {
        const digitFileNames: string[] = [
          'digit_0.png',
          'digit_1.png',
          'digit_2.png',
          'digit_3.png',
          'digit_4.png',
          'digit_5.png',
          'digit_6.png',
          'digit_7.png',
          'digit_8.png',
          'digit_9.png',
        ];
        const service = context.getTestClass();
        const promises = digitFileNames.map(async (digitFileName, digit) => {
          const digitPath = path.join(__dirname, 'images', digitFileName);
          const digitBase64 = base64EncodeFile(digitPath);
          const result = await service.recognizeDigitFromBase64(digitBase64);
          t.assert.strictEqual(result, digit);
          return result;
        });
        await Promise.all(promises);
      },
    );

    await it('handles error with temporary file', async (t: TestContext) => {
      const useTemporaryFileMock = t.mock.method(
        TemporaryFileService.prototype,
        'useTemporaryFile',
      );
      useTemporaryFileMock.mock.mockImplementation(() => {
        throw new Error('some error');
      });
      const base64 = 'fakebase64';
      const service = context.getTestClass();
      const result = await service.recognizeDigitFromBase64(base64);

      t.assert.strictEqual(result, null);
      t.assert.strictEqual(useTemporaryFileMock.mock.callCount(), 1);
    });
  });
});
