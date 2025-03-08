import assert from 'node:assert';
import { Lifecycle, scoped } from 'tsyringe';
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
import {
  CaisseDEpargneAdapterBalanceNotFoundError,
  CaisseDEpargneAdapterInvalidCredentialError,
  CaisseDEpargneAdapterParseBalanceError,
  CaisseDEpargnePasswordParseIntError,
} from './errors';

@scoped(Lifecycle.ContainerScoped)
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

  private async _getAccountBalanceLoggedIn<AccountId extends string>(
    accountIds: AccountId[],
  ): Promise<Record<AccountId, number>> {
    const logger = this.loggerService.getChild(
      this.logger,
      this._getAccountBalanceLoggedIn.name,
    );
    logger.trace({ accountIds });

    await using accountTiles = await this.browserService.findElements({
      by: BrowserServiceFindBy.SELECTOR,
      query: 'compte-contract-tile',
    });
    logger.debug(`found account labels: ${JSON.stringify(accountTiles)}`);

    const accountBalances = new Map<AccountId, number>();
    for (const accountTile of accountTiles.elements) {
      await using accountIdParagraph = await this.browserService.findChild(
        accountTile,
        'p[data-e2e=account-label]+p',
      );
      if (accountIdParagraph === null) {
        logger.warn('could not find account ID paragraph in account tile');
        continue;
      }

      // filter account tiles to find the one with the id, find and parse
      // the corresponding balance

      let accountTileId =
        await this.browserService.getElementText(accountIdParagraph);
      if (!accountTileId) {
        logger.warn(
          'could not find text inside account ID paragraph in account tile',
        );
        continue;
      }
      accountTileId = accountTileId.trim();

      let isRequestedId = false;
      for (const id of accountIds) {
        if (accountTileId === id.trim()) {
          isRequestedId = true;
          break;
        }
      }

      if (isRequestedId) {
        logger.debug(`found requested ID '${accountTileId}'`);
        const balanceSpans = await this.browserService.findChildren(
          accountTile,
          'compte-ui-balance[data-e2e=compte-balance-contract] .balance span',
        );
        await using balanceSpan1 = balanceSpans[0];
        await using balanceSpan2 = balanceSpans[1];
        if (!balanceSpan1 || !balanceSpan2) {
          throw new CaisseDEpargneAdapterBalanceNotFoundError(accountTileId);
        }

        const balanceWholePartText =
          await this.browserService.getElementText(balanceSpan1);
        if (!balanceWholePartText) {
          throw new CaisseDEpargneAdapterBalanceNotFoundError(accountTileId);
        }

        // strip currency suffix
        const currencySymbol = '€';
        const balanceDecimalPartText =
          await this.browserService.getElementText(balanceSpan2);
        if (!balanceDecimalPartText) {
          throw new CaisseDEpargneAdapterBalanceNotFoundError(accountTileId);
        }
        if (
          !balanceDecimalPartText.includes(currencySymbol) &&
          !balanceWholePartText.includes(currencySymbol)
        ) {
          throw new CaisseDEpargneAdapterParseBalanceError(accountTileId);
        }

        logger.debug({ balanceWholePartText, balanceDecimalPartText });
        const notNumberRegex = /[^0-9,.+-]/g;
        const balanceText =
          balanceWholePartText
            .replaceAll(notNumberRegex, '')
            .replace(',', '.') +
          balanceDecimalPartText
            .replaceAll(notNumberRegex, '')
            .replace(',', '.');

        const accountBalance = Number.parseFloat(balanceText);
        logger.debug({ balanceText, accountBalance });
        if (!Number.isFinite(accountBalance)) {
          throw new CaisseDEpargneAdapterParseBalanceError(
            accountTileId,
            balanceText,
          );
        }
        accountBalances.set(accountTileId as AccountId, accountBalance);
      } else {
        logger.debug(`'${accountTileId}' is not a requested ID`);
      }
    }

    const balances = {} as Record<AccountId, number>;
    return accountIds.reduce((balances, accountId) => {
      const balance = accountBalances.get(accountId);
      if (balance === undefined) {
        throw new CaisseDEpargneAdapterBalanceNotFoundError(accountId);
      }
      balances[accountId] = balance;
      logger.debug(`'${accountId}' -> ${balance.toString(10)}`);
      return balances;
    }, balances);
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
