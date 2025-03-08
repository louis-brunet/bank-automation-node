import assert from 'node:assert';
import { Logger } from 'pino';
import puppeteer, {
  Browser,
  LaunchOptions,
  Page,
  TimeoutError,
  WaitForSelectorOptions,
} from 'puppeteer';
import { Disposable, Lifecycle, scoped } from 'tsyringe';
import { BrowserConfig } from '../../config';
import { LoggerService } from '../logger.service';
import {
  BrowserServiceFindBy,
  BrowserServiceFindElementByIdRequest,
  BrowserServiceFindElementBySelectorRequest,
  BrowserServiceFindElementRequest,
  BrowserServiceFindElementResponse,
  BrowserServiceFoundElement,
  BrowserServiceFoundElements,
  ClassProperties,
  RequestedCssProperty,
} from './types';

@scoped(Lifecycle.ContainerScoped)
export class BrowserService implements Disposable {
  private _browser: Browser | undefined;
  private _page: Page | undefined;
  private readonly _logger: Logger;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly config: BrowserConfig,
  ) {
    this._logger = this.loggerService.getLogger(BrowserService.name);
  }

  async dispose(): Promise<void> {
    const logger = this.loggerService.getChild(this._logger, this.dispose.name);
    await this.close();
    logger.trace('disposed');
  }

  async close() {
    const logger = this.loggerService.getChild(this._logger, this.close.name);
    logger.trace('called');

    await this._browser?.close();
    this._browser = undefined;
    this._page = undefined;
    logger.info('closed browser');
  }

  async get(url: string) {
    const logger = this.loggerService.getChild(this._logger, this.get.name);
    logger.trace({ url });

    const page = await this._getPage();
    return await page.goto(url);
    // , {
    //   waitUntil: ['networkidle0'],
    // });
  }

  async clickElementById(id: string) {
    const logger = this.loggerService.getChild(
      this._logger,
      this.clickElementById.name,
    );
    logger.trace({ id });

    const element = await this._locateElementById(id);
    element.setEnsureElementIsInTheViewport(false);
    await element.click();
  }

  async fillInput(id: string, content: string) {
    const logger = this.loggerService.getChild(
      this._logger,
      this.fillInput.name,
    );
    logger.trace({ id, content });
    const element = await this._locateElementById(id);
    element.setEnsureElementIsInTheViewport(false);
    await element.fill(content);
  }

  async isVisible(selector: string, opts?: { timeoutMs?: number }) {
    const page = await this._getPage();
    try {
      const found = await page.waitForSelector(selector, {
        timeout: opts?.timeoutMs ?? 1,
      });
      return !!found;
    } catch (e) {
      if (e instanceof TimeoutError) {
        return false;
      }
      throw e;
    }
  }

  async findElements<
    Request extends BrowserServiceFindElementRequest<CssProperty, Query>,
    CssProperty extends
      RequestedCssProperty<Request> = RequestedCssProperty<Request>,
    Query extends string = Request['query'],
  >(request: Request): Promise<BrowserServiceFindElementResponse<Request>> {
    const logger = this.loggerService.getChild(
      this._logger,
      this.findElements.name,
    );
    logger.trace({ request });

    switch (request.by) {
      case BrowserServiceFindBy.ID: {
        return (await this._findElementById(
          request,
        )) as BrowserServiceFindElementResponse<typeof request>;
      }
      case BrowserServiceFindBy.SELECTOR: {
        return (await this._findElementsBySelector(
          request,
        )) as BrowserServiceFindElementResponse<typeof request>;
      }
      default:
        throw new Error('unrecognized enum value');
    }
  }

  async clickFoundElement(elementToClick: BrowserServiceFoundElement) {
    await elementToClick.handle.click();
  }

  async waitForElementToDisappear(
    selector: string,
    opts?: { timeoutMs?: number },
  ) {
    await this.waitForSelector(selector, { ...opts, hidden: true });
  }

  async waitForSelector(
    selector: string,
    opts?: { hidden?: boolean; timeoutMs?: number },
  ) {
    const page = await this._getPage();
    const waitOptions: WaitForSelectorOptions = {};
    if (opts?.hidden !== undefined) {
      waitOptions.hidden = opts.hidden;
    }
    if (opts?.timeoutMs !== undefined) {
      waitOptions.timeout = opts.timeoutMs;
    }
    await page.waitForSelector(selector, waitOptions);
  }

  async findChild(element: BrowserServiceFoundElement, selector: string) {
    const children = await this.findChildren(element, selector);
    return children[0] ?? null;
  }

  async findChildren(
    element: BrowserServiceFoundElement,
    selector: string,
  ): Promise<BrowserServiceFoundElement[]> {
    const childHandles = await element.handle.$$(selector);
    const elements = childHandles.map(
      (handle) => new BrowserServiceFoundElement(handle),
    );
    return elements;
  }

  async getElementText(foundElement: BrowserServiceFoundElement) {
    return await foundElement.handle.evaluate((element) => {
      return element.textContent;
    });
  }

  private async _findElementById<
    Request extends BrowserServiceFindElementByIdRequest<CssProperty, Query>,
    CssProperty extends
      RequestedCssProperty<Request> = RequestedCssProperty<Request>,
    Query extends string = Request['query'],
  >(request: Request): Promise<BrowserServiceFindElementResponse<Request>> {
    const logger = this.loggerService.getChild(
      this._logger,
      this._findElementById.name,
    );
    const { query: id } = request;
    logger.trace({ id });

    const page = await this._getPage();
    // const handle = await page.locator(`#${id}`).waitHandle();
    // logger.debug('waited for elements');
    //
    //
    const handle = await page.$(`#${id}`);
    if (handle === null) {
      logger.debug(`could not find element with ID '${id}'`);
      return null as BrowserServiceFindElementResponse<typeof request>;
    }

    // TODO: find element by id
    throw new Error('todo find element by id');
  }

  private async _findElementsBySelector<
    Request extends BrowserServiceFindElementBySelectorRequest<
      CssProperty,
      string
    >,
    CssProperty extends
      RequestedCssProperty<Request> = RequestedCssProperty<Request>,
  >(request: Request): Promise<BrowserServiceFindElementResponse<Request>> {
    const logger = this.loggerService.getChild(
      this._logger,
      this._findElementsBySelector.name,
    );
    const { query: selector } = request;
    logger.trace({ selector });

    const page = await this._getPage();
    await page.waitForSelector(selector);
    logger.debug('waited for elements');

    const elementHandles = await page.$$(selector);
    const elements: BrowserServiceFoundElement<CssProperty>[] =
      await Promise.all(
        elementHandles.map(async function mapElements(handle) {
          const mappedElement = await handle.evaluateHandle(
            (element, cssProperties) => {
              // const foundElement: Omit<
              //   BrowserServiceFoundElement<CssProperty>,
              //   'handle'
              // > = new BrowserServiceFoundElement(handle);
              const foundElement: Omit<
                ClassProperties<BrowserServiceFoundElement>,
                'handle'
              > = {};
              if (cssProperties) {
                const allStyle = window.getComputedStyle(element);
                foundElement.style = Object.fromEntries(
                  cssProperties.map((property) => [
                    property,
                    allStyle.getPropertyValue(property),
                  ]),
                ) as Record<CssProperty, string>;
              }
              return foundElement;
            },
            request.cssProperties,
          );
          return BrowserServiceFoundElement.from({
            ...(await mappedElement.jsonValue()),
            handle,
          });
        }),
      );
    logger.debug(`found elements: ${JSON.stringify(elements)}`);
    logger.debug(`found ${elements.length.toString(10)} elements`);
    return new BrowserServiceFoundElements(
      elements,
    ) as BrowserServiceFindElementResponse<typeof request>;
    // return elements as BrowserServiceFindElementResponse<typeof request>;
    // // const f = await e[0]?.evaluateHandle((e) => {
    // //   window.getComputedStyle(e)
    // //
    // //   return false as const;
    // // });
    //
    // const elements = await page.$$eval(
    //   selector,
    //   (selected, cssProperties, selector) => {
    //     return selected.map((element, elementIndex) => {
    //       const result: BrowserServiceFoundElement<CssProperty> = {
    //         foundBy: {
    //           by: 'selector',
    //           selector,
    //           index: elementIndex,
    //         },
    //       };
    //       if (element.id) {
    //         result.foundBy.id = element.id;
    //       }
    //       if (cssProperties) {
    //         const allStyle = window.getComputedStyle(element);
    //         result.style = Object.fromEntries(
    //           cssProperties.map((property) => [
    //             property,
    //             allStyle.getPropertyValue(property),
    //           ]),
    //         ) as Record<CssProperty, string>;
    //       }
    //       return result;
    //     });
    //   },
    //   request.cssProperties,
    //   selector,
    // );
    // logger.debug(`found elements: ${JSON.stringify(elements)}`);
    // logger.debug(`found ${elements.length.toString(10)} elements`);
    // return elements as BrowserServiceFindElementResponse<typeof request>;
    //
    // // await page.locator(selector).wait();
    // //
    // // const elements = await page.$$(selector);
    // // return elements;
  }

  private async _locateElement(selector: string) {
    const logger = this.loggerService.getChild(
      this._logger,
      this._locateElement.name,
    );
    logger.trace({ selector });

    // return this.findElementsBySelector(`#${id}`);
    const page = await this._getPage();
    return page.locator(selector);
  }

  private async _locateElementById(id: string) {
    return await this._locateElement(`#${id}`);
  }

  private async _getBrowser() {
    if (!this._browser) {
      const launchOptions: LaunchOptions = {
        browser: this.config.browser,
        headless: this.config.headless,
      };
      if (this.config.slowMoMilliseconds !== undefined) {
        launchOptions.slowMo = this.config.slowMoMilliseconds;
      }
      this._browser = await puppeteer.launch(launchOptions);
    }
    return this._browser;
  }

  private async _getPage() {
    if (!this._page) {
      const browser = await this._getBrowser();
      this._page = (await browser.pages())[0];
    }
    assert.ok(this._page, 'could not find page');
    this._page.setDefaultTimeout(this.config.defaultTimeoutMilliseconds);
    this._page.setDefaultNavigationTimeout(
      this.config.defaultNavigationTimeoutMilliseconds,
    );
    return this._page;
  }
}

// def __init__(self, web_driver: WebDriver) -> None:
//     self.web_driver = web_driver
//     self.web_driver.implicitly_wait(0.5)
//     super().__init__()
//
// def get(self, url: str):
//     self.web_driver.get(url)
//
// def find_element_by_id_optional(self, id: str) -> WebElement | None:
//     return self._find_element_optional(by=By.ID, value=id)
//
// def find_element_by_id(self, id: str) -> WebElement:
//     return self._find_element(by=By.ID, value=id)
//
// def find_elements_by_css_selector(self, selector: str) -> list[WebElement]:
//     return self._find_elements(by=By.CSS_SELECTOR, value=selector)
//
// def get_current_url(self) -> str:
//     return self.web_driver.current_url
//
// async def wait_for_element_to_disappear(
//     self,
//     by: ByType,
//     value: str,
//     max_try_count: int = 30,
//     sleep_delay_in_seconds: float = 2.0,
// ):
//     logger = self.logger.getChild(self.wait_for_element_to_disappear.__name__)
//
//     def stop_condition() -> bool:
//         element = self._find_element_optional(by=by, value=value)
//         if element is None:
//             return True
//         logger.error("Found MFA dialog, waiting for human MFA approval...")
//         return False
//
//     return await self._wait_for(
//         is_stop_condition_reached=stop_condition,
//         max_try_count=max_try_count,
//         sleep_delay_in_seconds=sleep_delay_in_seconds,
//     )
//
// async def wait_for_elements(
//     self,
//     by: ByType,
//     value: str,
//     max_try_count: int = 5,
//     sleep_delay_in_seconds: float = 1.0,
// ) -> list[WebElement]:
//     logger = self.logger.getChild(self.wait_for_elements.__name__)
//     elements: list[WebElement] = []
//
//     def stop_condition():
//         nonlocal elements
//         elements = self._find_elements(by=by, value=value)
//         if len(elements) > 0:
//             return True
//         logger.error(f"No elements found (by='{by}', value='{value}')")
//         return False
//
//     await self._wait_for(
//         is_stop_condition_reached=stop_condition,
//         max_try_count=max_try_count,
//         sleep_delay_in_seconds=sleep_delay_in_seconds,
//     )
//
//     return elements
//
// async def _wait_for(
//     self,
//     is_stop_condition_reached: Callable[[], bool],
//     max_try_count: int = 30,
//     sleep_delay_in_seconds: float = 2.0,
// ):
//     logger = self.logger.getChild(self._wait_for.__name__)
//
//     for try_index in range(max_try_count):
//         if is_stop_condition_reached():
//             return
//         await asyncio.sleep(sleep_delay_in_seconds)
//         logger.info(f"Waiting... ({try_index + 1}/{max_try_count})")
//     raise MaxRetriesExceededError(try_count=max_try_count)
//
// def _find_element(self, by: ByType, value: str | None) -> WebElement:
//     return self.web_driver.find_element(by=by, value=value)
//
// def _find_element_optional(
//     self, by: ByType, value: str | None
// ) -> WebElement | None:
//     try:
//         return self._find_element(by=by, value=value)
//     except NoSuchElementException:
//         return None
//
// def _find_elements(
//     self,
//     by: ByType,
//     value: str | None,
// ) -> list[WebElement]:
//     return self.web_driver.find_elements(by=by, value=value)
//
