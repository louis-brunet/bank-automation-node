import './setup';

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, TestContext } from 'node:test';
import { DigitRecognitionService } from '../src';
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
      t.assert.ok(!!context.testClass.recognizeDigitFromBase64);
    });

    await it('reconizes sample digits', { plan: 10 }, async (t) => {
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

      // FIXME: figure out why test hangs with Promise.all
      //  It is probably the same thing that makes the app hang and need to be interrupted
      //
      // const promises = digitFileNames.map(async (digitFileName, digit) => {
      //   const digitPath = path.join(__dirname, 'images', digitFileName);
      //   const digitBase64 = base64EncodeFile(digitPath);
      //   const result =
      //     await context.testClass.recognizeDigitFromBase64(digitBase64);
      //   t.assert.equal(result /*  ?? 1 */, digit);
      //   console.debug(`recognized ${digit.toString(10)}`);
      //   return result;
      // });
      // console.log('foo');
      // await Promise.all(promises);
      // console.log('hi');

      for (const [digit, digitFileName] of digitFileNames.entries()) {
        const digitPath = path.join(__dirname, 'images', digitFileName);
        const digitBase64 = base64EncodeFile(digitPath);
        const result =
          await context.testClass.recognizeDigitFromBase64(digitBase64);

        t.assert.equal(result, digit);
      }
    });
  });
});
