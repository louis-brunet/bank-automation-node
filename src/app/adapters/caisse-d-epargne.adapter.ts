import assert from 'node:assert';
import { singleton } from 'tsyringe';
import {
  CAISSE_D_EPARGNE_PASSWORD_MAX_LENGTH,
  CAISSE_D_EPARGNE_PASSWORD_MIN_LENGTH,
  CaisseDEpargneConfig,
} from '../config';
import {
  BrowserService,
  BrowserServiceFindBy,
  BrowserServiceFoundElement,
  LoggerService,
} from '../infra';
import { DigitRecognitionService } from '../services';
import { CaisseDEpargneAdapterInvalidCredentialError } from './errors';

export class CaisseDEpargnePasswordParseIntError extends Error {
  constructor(passwordChar: string) {
    assert.equal(passwordChar.length, 1);
    super(`could not parse password character '${passwordChar}' as an integer`);
  }
}

@singleton()
export class CaisseDEpargneAdapter {
  private readonly logger;

  constructor(
    private readonly config: CaisseDEpargneConfig,
    private readonly browserService: BrowserService,
    private readonly loggerService: LoggerService,
    private readonly digitRecognitionService: DigitRecognitionService,
  ) {
    this.logger = this.loggerService.getLogger(CaisseDEpargneAdapter.name);
  }

  async getCheckingAccountBalance(): Promise<number> {
    const logger = this.loggerService.getChild(
      this.logger,
      this.getCheckingAccountBalance.name,
    );
    logger.trace('called');
    await this.login();
    const balances = await this._getAccountBalanceLoggedIn([
      this.config.checkingAccount,
    ]);
    const checkingAccountBalance = balances[this.config.checkingAccount];
    assert.ok(checkingAccountBalance !== undefined);
    logger.debug({ checkingAccountBalance });
    return checkingAccountBalance;
  }

  private async login() {
    const logger = this.loggerService.getChild(this.logger, this.login.name);
    logger.trace('called');

    await this.browserService.get(
      `${this.config.baseUrl}/banque-a-distance/acceder-compte/`,
    );
    await this.browserService.clickElementById('no_consent_btn');

    await this.browserService.get(
      `${this.config.baseUrl}/se-connecter/sso?service=dei`,
    );
    await this.browserService.fillInput(
      'input-identifier',
      this.config.accountId + '\n',
    );
    // await this.browserService.clickElementById('p-identifier-btn-validate');

    await using buttons = await this.browserService.findElements({
      by: BrowserServiceFindBy.SELECTOR,
      query: 'button.keyboard-button',
      cssProperties: ['background-image'],
    });
    assert.equal(
      buttons.elements.length,
      10,
      'Expected 10 buttons, one for each digit 0-9',
    );

    const buttonsWithDigit = await Promise.all(
      buttons.elements.map((button) => this._getDigitFromButton(button)),
    );
    const sortedButtons = buttonsWithDigit.sort((button1, button2) => {
      return button1.digit - button2.digit;
    });

    logger.info({ sortedButtons }, 'Finished sorting buttons');

    const passwordLength = this.config.accountPassword.length;
    assert.ok(passwordLength >= CAISSE_D_EPARGNE_PASSWORD_MIN_LENGTH);
    assert.ok(passwordLength <= CAISSE_D_EPARGNE_PASSWORD_MAX_LENGTH);
    for (
      let passwordCharIndex = 0;
      passwordCharIndex < passwordLength;
      passwordCharIndex++
    ) {
      const nextChar = this.config.accountPassword.charAt(passwordCharIndex);
      const nextDigit = Number.parseInt(nextChar);
      if (!Number.isInteger(nextDigit)) {
        throw new CaisseDEpargnePasswordParseIntError(nextChar);
      }
      const buttonToClick = sortedButtons[nextDigit];
      assert.ok(buttonToClick);
      await this.browserService.clickFoundElement(buttonToClick.button);
    }

    logger.debug('clicking password submit');
    await this.browserService.clickElementById('p-password-btn-submit');

    const isPasswordFailed = await this.browserService.isVisible(
      'as-password-failed',
      {
        timeoutMs: 2_000,
      },
    );
    if (isPasswordFailed) {
      throw new CaisseDEpargneAdapterInvalidCredentialError();
    }

    logger.info(
      `waiting ${this.config.mfaWaitTimeoutMillisecons.toString(10)}ms for MFA dialog to disappear`,
    );
    await this.browserService.waitForElementToDisappear(
      '#m-identifier-cloudcard-btn-fallback',
      { timeoutMs: this.config.mfaWaitTimeoutMillisecons },
    );
    logger.info('could not find MFA dialog button, continuing');
  }

  private async _getAccountBalanceLoggedIn<Ids extends string>(
    accountIds: Ids[],
  ): Promise<Record<Ids, number>> {
    const logger = this.loggerService.getChild(
      this.logger,
      this._getAccountBalanceLoggedIn.name,
    );
    logger.trace({ accountIds });

    const sleepMs = 5_000;
    await new Promise((resolve) => {
      setTimeout(resolve, sleepMs);
    });
    throw new Error('todo');

    // TODO: filter account tiles to find the one with the id, find and parse
    // the corresponding balance

    //     account_tiles = await self.browser_service.wait_for_elements(
    //         by=By.CSS_SELECTOR,
    //         value="compte-contract-tile",
    //     )
    //
    //     logger.debug(f"found account labels: {account_tiles}")
    //
    //     account_balances = {}
    //
    //     for account_tile in account_tiles:
    //         account_tile_id_p = account_tile.find_element(
    //             by=By.CSS_SELECTOR,
    //             value="p[data-e2e=account-label]+p",
    //         )
    //         account_tile_id = account_tile_id_p.text.strip()
    //         if account_tile_id in accounts.keys():
    //             logger.debug(
    //                 f"found account tile for account with id: {account_tile_id}"
    //             )
    //             balance_spans = account_tile.find_elements(
    //                 by=By.CSS_SELECTOR,
    //                 value="compte-ui-balance[data-e2e=compte-balance-contract] .balance span",
    //             )
    //             expected_currency_suffix = accounts[account_tile_id].currency
    //             assert len(balance_spans) == 2
    //             assert balance_spans[1].text.strip()[-1] == expected_currency_suffix
    //
    //             balance = self._get_balance_from_raw_parts(
    //                 [span.text for span in balance_spans]
    //             )
    //             logger.debug(
    //                 f"account balance for account ID {account_tile_id} is: {balance}"
    //             )
    //
    //             account_balances[account_tile_id] = balance
    //
    //     for expected_key in accounts.keys():
    //         if expected_key not in account_balances:
    //             raise CaisseDEpargneAccountNotFoundError(expected_key)
    //
    //     return account_balances
  }

  private async _getDigitFromButton(
    button: BrowserServiceFoundElement<'background-image'>,
  ) {
    const backgroundImage = button.style?.['background-image'];
    const base64Image = this._getBase64FromBackgroundImage(backgroundImage);
    assert(!!base64Image);
    const digit = await this._recognizeDigitFromBase64(base64Image);
    assert(digit !== null);
    return { button, digit };
  }

  private _getBase64FromBackgroundImage(
    backgroundImage: string | undefined,
  ): string | undefined {
    const logger = this.loggerService.getChild(
      this.logger,
      this.getCheckingAccountBalance.name,
    );
    logger.trace({ backgroundImage });
    if (backgroundImage === undefined) {
      return undefined;
    }

    const base64Regex = /url\("data:image\/png;base64,(.*)"\)/;
    const matched = base64Regex.exec(backgroundImage);

    if (!matched || !matched[1]) {
      logger.error(
        { matched },
        'could not find base64 image from background-image value',
      );
      return undefined;
    }

    return matched[1];
  }

  private async _recognizeDigitFromBase64(
    base64Image: string,
  ): Promise<number | null> {
    return await this.digitRecognitionService.recognizeDigitFromBase64(
      base64Image,
    );
  }
}

//     logger = self.logger.getChild(self.get_account_balance.__name__)
//     logger.debug(f"starting login flow for account ids: {accounts}")
//
//     self.browser_service.get(
//         "https://www.caisse-epargne.fr/banque-a-distance/acceder-compte/"
//     )
//     no_consent = self.browser_service.find_element_by_id(id="no_consent_btn")
//     no_consent.click()
//     self.browser_service.get(
//         "https://www.caisse-epargne.fr/se-connecter/sso?service=dei"
//     )
//     identifier_input = self.browser_service.find_element_by_id(
//         id="input-identifier"
//     )
//     identifier_input.send_keys(self.config.account_id)
//     identifier_input.send_keys("\n")
//
//     time.sleep(2)  # TODO: remove sleep
//
//     logger.debug("sort password buttons")
//     buttons = self.browser_service.find_elements_by_css_selector(
//         selector="button.keyboard-button"
//     )
//     ordered_buttons = self._sort_buttons(buttons)
//
//     logger.debug("input configured password using sorted numeric buttons")
//     remaining_password = self.config.account_password
//
//     while remaining_password != "":
//         try:
//             next_char = int(remaining_password[0])
//         except ValueError:
//             raise PasswordParseError()
//         if next_char < 0 or next_char > 9:
//             raise PasswordParseError()
//
//         button = ordered_buttons[next_char]
//         button.click()
//         remaining_password = remaining_password[1:]
//
//     logger.debug("submit password")
//     password_submit_button = self.browser_service.find_element_by_id(
//         id="p-password-btn-submit"
//     )
//     password_submit_button.click()
//
//     time.sleep(2)  # TODO: remove sleep
//
//     logger.debug(f"URL: {self.browser_service.get_current_url()}")
//
//     await self.browser_service.wait_for_element_to_disappear(
//         by=By.ID, value="m-identifier-cloudcard-btn-fallback"
//     )
//
//     logger.info("Could not find MFA dialog button, continuing")
//
//     account_tiles = await self.browser_service.wait_for_elements(
//         by=By.CSS_SELECTOR,
//         value="compte-contract-tile",
//     )
//
//     logger.debug(f"found account labels: {account_tiles}")
//
//     account_balances = {}
//
//     for account_tile in account_tiles:
//         account_tile_id_p = account_tile.find_element(
//             by=By.CSS_SELECTOR,
//             value="p[data-e2e=account-label]+p",
//         )
//         account_tile_id = account_tile_id_p.text.strip()
//         if account_tile_id in accounts.keys():
//             logger.debug(
//                 f"found account tile for account with id: {account_tile_id}"
//             )
//             balance_spans = account_tile.find_elements(
//                 by=By.CSS_SELECTOR,
//                 value="compte-ui-balance[data-e2e=compte-balance-contract] .balance span",
//             )
//             expected_currency_suffix = accounts[account_tile_id].currency
//             assert len(balance_spans) == 2
//             assert balance_spans[1].text.strip()[-1] == expected_currency_suffix
//
//             balance = self._get_balance_from_raw_parts(
//                 [span.text for span in balance_spans]
//             )
//             logger.debug(
//                 f"account balance for account ID {account_tile_id} is: {balance}"
//             )
//
//             account_balances[account_tile_id] = balance
//
//     for expected_key in accounts.keys():
//         if expected_key not in account_balances:
//             raise CaisseDEpargneAccountNotFoundError(expected_key)
//
//     return account_balances
//
// def _get_base64_from_background_image(self, background_image: str) -> str:
//     matched = re.search(r'url\("data:image/png;base64,(.*)"\)', background_image)
//     if matched:
//         return matched.group(1)
//     raise ValueError(
//         f"could not get base64 from background image value: {background_image}"
//     )
//
// def _get_button_value(self, background_image: str) -> int | None:
//     image_base64 = self._get_base64_from_background_image(background_image)
//     button_value = self.digit_recognition_service.recognize_digit_from_base64(
//         image_base64
//     )
//     return button_value
//
// def _sort_buttons(self, buttons: list[WebElement]) -> list[WebElement]:
//     button_values: list[tuple[int, WebElement]] = []
//
//     for button in buttons:
//         background_image = button.value_of_css_property("background-image")
//         button_value = self._get_button_value(background_image)
//         if button_value is None:
//             raise PasswordOcrError(background_image)
//         button_values.append((button_value, button))
//
//     ordered_buttons = [
//         button for _, button in sorted(button_values, key=lambda x: x[0])
//     ]
//     return ordered_buttons
//
// def _get_balance_from_raw_parts(self, balance_span_contents: list[str]) -> float:
//     logger = self.logger.getChild(self._get_balance_from_raw_parts.__name__)
//     [whole_part, decimal_part] = [
//         re.sub(r"[^0-9,.-]", "", text) for text in balance_span_contents
//     ]
//     logger.debug(f"whole_part='{whole_part}', decimal_part='{decimal_part}'")
//
//     balance = float(f"{whole_part}{decimal_part.replace(',', '.')}")
//     return balance
//
