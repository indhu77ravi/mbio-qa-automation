/**
 * Custom Cucumber World: one instance per scenario, so nothing leaks between scenarios.
 * Steps use `this.page`, `this.poManager`, `this.data` and `this.ctx` (like the reference framework),
 * with the fields declared here so VS Code can autocomplete them.
 */
const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { data } = require('./testData');

class CustomWorld extends World {
  constructor(options) {
    super(options);
    /** @type {import('@playwright/test').Browser | null} */ this.browser = null;
    /** @type {import('@playwright/test').BrowserContext | null} */ this.context = null;
    /** @type {import('@playwright/test').Page | null} */ this.page = null;
    /** @type {import('../pages/PageObjectManager') | null} */ this.poManager = null;
    /** Active region profile (TestData/ae.json by default). */
    this.data = data;
    /** @type {string[]} */ this.consoleLogs = [];
    /** @type {Error[]} */ this.pageErrors = [];
    this.isVisualScenario = false;

    /** State handed from one step to the next within this scenario. */
    this.ctx = {
      /** @type {import('@playwright/test').Page | undefined} page after a new tab opens */
      activePage: undefined,
      /** @type {import('@playwright/test').Response | null | undefined} */
      response: undefined,
      selectedSymbol: undefined,
      /** @type {Map<string, string[]>} category label -> symbols shown */
      categoryLists: new Map(),
      apiCategories: undefined,
      priceQuotes: undefined,
      /** @type {string[]} */ failedApiCalls: [],
      /** @type {Promise<unknown>[]} async work started by listeners that later steps await */
      pending: [],
      linkResults: [],
      storeResult: undefined,
    };
  }

  /** The page currently in focus: a popup/new tab if one was opened, otherwise the main page. */
  get activePage() {
    return this.ctx.activePage || this.page;
  }
}

setWorldConstructor(CustomWorld);
module.exports = { CustomWorld };
