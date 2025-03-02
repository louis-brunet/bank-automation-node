import './setup';

import assert from 'assert';
import { describe, it } from 'node:test';
import { DigitRecognitionService } from '../src';
import { createUnitTestSuite } from './shared';

// function base64EncodeFile(filePath: string): string {
//   // Read the file
//   const fileData = fs.readFileSync(filePath);
//
//   // Convert the file data to base64
//   return fileData.toString('base64');
// }

void createUnitTestSuite(DigitRecognitionService, async (context) => {
  await describe('recognizeDigitFromBase64', {}, async () => {
    await it('is defined', (_testContext) => {
      assert.ok(!!context.testClass.recognizeDigitFromBase64);
    });

    await it(
      'reconizes sample digits',
      { todo: 'fix the pending promises at end of test', plan: 10 },
      async (_testContext) => {
        // const digitFileNames = [
        //   'digit_0.png',
        //   'digit_1.png',
        //   'digit_2.png',
        //   'digit_3.png',
        //   'digit_4.png',
        //   'digit_5.png',
        //   'digit_6.png',
        //   'digit_7.png',
        //   'digit_8.png',
        //   'digit_9.png',
        // ];
        // const promises = digitFileNames.map(async (digitFileName, _digit) => {
        //   const digitPath = path.join(__dirname, 'images', digitFileName);
        //   const digitBase64 = base64EncodeFile(digitPath);
        //
        //   const result =
        //     await context.testClass.recognizeDigitFromBase64(digitBase64);
        //
        //   return result;
        // });
        // const results = await Promise.all(promises);
        // assert.deepEqual(results, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        // for (const [digit, digitFileName] of digitFileNames.entries()) {
        //   const digitPath = path.join(__dirname, 'images', digitFileName);
        //   const digitBase64 = base64EncodeFile(digitPath);
        //
        //   const result =
        //     await context.testClass.recognizeDigitFromBase64(digitBase64);
        //
        //   assert.equal(result, digit);
        // }
      },
    );
  });
});
