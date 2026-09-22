/**
 * Spot market, categories, home movers and market data API.
 * Prices are live, so steps assert formats and business rules, never exact values.
 */
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { utils } = require('./utils');
const { SoftAssert } = require('./softAssert');
const { logTestData } = require('./allurelogger');
const ExplorePage = require('../pages/ExplorePage');
const { data } = require('../support/testData');

function asDirection(word) {
  if (word !== 'up' && word !== 'down') throw new Error(`Direction must be "up" or "down", got "${word}"`);
  return word;
}

// ---------- spot market ----------

Given('the spot market has loaded', async function () {
  const { table } = this.poManager.explorePage;
  await table.root.scrollIntoViewIfNeeded();
  await table.waitForData(1);
});

Then('the spot market shows at least {int} asset(s)', async function (min) {
  await this.poManager.explorePage.table.waitForData(min);
});

Then('the spot market eventually lists at least {int} assets', { timeout: 90_000 }, async function (min) {
  const { table } = this.poManager.explorePage;
  await table.root.scrollIntoViewIfNeeded();
  await table.waitForData(min, 45_000);
});

Then('every spot market entry has a symbol and a name', async function () {
  const soft = new SoftAssert();
  for (const row of await this.poManager.explorePage.table.readRows()) {
    await soft.check(`"${row.assetCell}" symbol`, () => expect(row.symbol).toMatch(utils.SYMBOL));
    await soft.check(`"${row.assetCell}" symbol + name`, () =>
      expect(row.assetCell).toMatch(new RegExp(`^${row.symbol}\\s+\\S`)),
    );
  }
  soft.assertAll('Symbols and names');
});

Then('every spot market entry has a USD price', async function () {
  const rows = await this.poManager.explorePage.table.readRows();
  await logTestData('Spot market snapshot', rows.map((r) => ({ symbol: r.symbol, price: r.priceCell, change: r.changeCell, direction: r.direction })));
  const soft = new SoftAssert();
  for (const row of rows) {
    await soft.check(`${row.symbol} price format`, () => expect(row.priceCell).toMatch(/^\$\d/));
    await soft.check(`${row.symbol} price`, () => expect(utils.parsePrice(row.priceCell)).toBeGreaterThanOrEqual(0));
  }
  soft.assertAll('Prices');
});

Then('every spot market entry has a 24h change with a direction arrow', async function () {
  const soft = new SoftAssert();
  for (const row of await this.poManager.explorePage.table.readRows()) {
    await soft.check(`${row.symbol} % change`, () => expect(Number.isFinite(utils.parsePercent(row.changeCell))).toBe(true));
    await soft.check(`${row.symbol} direction arrow`, () => expect(row.direction).not.toBeNull());
    await soft.check(`${row.symbol} both arrows`, () => expect(row.conflictingIndicators).toBe(false));
  }
  soft.assertAll('24h change');
});

Then('every spot market entry links to its detail page', async function () {
  const soft = new SoftAssert();
  for (const row of await this.poManager.explorePage.table.readRows()) {
    await soft.check(`${row.symbol} link`, () => expect(row.href).toMatch(new RegExp(`/explore/${row.symbol}$`)));
  }
  soft.assertAll('Detail links');
});

Then('no spot market entry shows a broken value', async function () {
  await expect(this.poManager.explorePage.table.root).not.toContainText(utils.BROKEN_VALUE);
});

Then('no asset appears twice in the spot market', async function () {
  const symbols = await this.poManager.explorePage.table.symbols();
  expect(symbols.filter((s, i) => symbols.indexOf(s) !== i), 'duplicates').toEqual([]);
});

When('I select the first asset in the spot market', async function () {
  const { table } = this.poManager.explorePage;
  const [first] = await table.symbols();
  this.ctx.selectedSymbol = first;
  await table.row(first).getByRole('link').first().click();
});

Then("I am on that asset's detail page", async function () {
  const symbol = this.ctx.selectedSymbol;
  await expect(this.page).toHaveURL(new RegExp(`/explore/${symbol}/?$`, 'i'));
  await expect(this.page.getByRole('heading', { name: new RegExp(data.notFound.headingPattern, 'i') })).toBeHidden();
  await expect(this.page.getByText(symbol).first()).toBeVisible();
});

// ---------- categories ----------

When('I select the {string} category', async function (label) {
  const explore = this.poManager.explorePage;
  await explore.selectCategory(label);
  this.ctx.categoryLists.set(label, await explore.table.symbols());
});

When('I view every category', async function () {
  const explore = this.poManager.explorePage;
  await explore.table.root.scrollIntoViewIfNeeded();
  for (const { label } of data.explore.categories) {
    await explore.selectCategory(label);
    this.ctx.categoryLists.set(label, await explore.table.symbols());
  }
  await logTestData('Assets per category', Object.fromEntries(this.ctx.categoryLists));
});

Then('the {string} category is active', async function (label) {
  expect(await ExplorePage.isActive(this.poManager.explorePage.category(label))).toBe(true);
});

Then('every asset shown is moving {word}', async function (word) {
  const direction = asDirection(word);
  const rows = await this.poManager.explorePage.table.readRows();
  expect(rows.filter((r) => r.direction !== direction).map((r) => r.symbol), `assets not moving ${direction}`).toEqual([]);
});

Then('each category shows a different list', async function () {
  const distinct = new Set([...this.ctx.categoryLists.values()].map((l) => l.join(',')));
  expect(distinct.size, 'categories show identical lists').toBe(this.ctx.categoryLists.size);
});

Then('{string} and {string} have no assets in common', async function (a, b) {
  const second = this.ctx.categoryLists.get(b) || [];
  expect((this.ctx.categoryLists.get(a) || []).filter((s) => second.includes(s))).toEqual([]);
});

Then('each category only shows assets the API assigns to it', async function () {
  await Promise.all(this.ctx.pending);
  expect(this.ctx.apiCategories, 'category API response was not captured').toBeDefined();
  await logTestData('Category API response', this.ctx.apiCategories);

  const soft = new SoftAssert();
  for (const { label, apiId } of data.explore.categories) {
    const api = this.ctx.apiCategories.find((c) => c.id === apiId);
    await soft.check(`API category "${apiId}"`, () => expect(api).toBeDefined());
    const unexpected = (this.ctx.categoryLists.get(label) || []).filter((s) => !api?.items.includes(s));
    await soft.check(`"${label}" shows assets outside the API category`, () => expect(unexpected).toEqual([]));
  }
  soft.assertAll('UI categories vs API');
});

// ---------- home movers ----------

When('I scroll to the {string} widget', async function (heading) {
  const widget = this.poManager.homePage.movers(heading);
  await widget.root.scrollIntoViewIfNeeded();
  await expect(widget.items.first()).toBeVisible();
});

Then('the {string} widget lists at least {int} assets with a price and change', async function (heading, min) {
  const entries = await this.poManager.homePage.movers(heading).read();
  expect(entries.length).toBeGreaterThanOrEqual(min);
  const soft = new SoftAssert();
  for (const entry of entries) {
    await soft.check(`"${entry.text}" symbol`, () => expect(entry.symbol).toMatch(utils.SYMBOL));
    await soft.check(`"${entry.text}" price and change`, () => expect(entry.text).toMatch(/\$[\d,.]+.*\d%/));
  }
  soft.assertAll(heading);
});

Then('every asset in {string} is moving {word}', async function (heading, word) {
  const direction = asDirection(word);
  const wrong = (await this.poManager.homePage.movers(heading).read()).filter((e) => e.direction !== direction);
  expect(wrong.map((e) => e.text), `assets in "${heading}" not moving ${direction}`).toEqual([]);
});

// ---------- market data API ----------

Then('no first-party API call failed', async function () {
  expect(this.ctx.failedApiCalls).toEqual([]);
});

Then('the price feed returns JSON quotes', async function () {
  await Promise.all(this.ctx.pending);
  expect(this.ctx.priceQuotes, 'price feed response was not captured').toBeDefined();
  expect(this.ctx.priceQuotes.length).toBeGreaterThan(0);
});

Then('every quote is internally consistent', async function () {
  const soft = new SoftAssert();
  for (const q of this.ctx.priceQuotes || []) {
    const label = `${q.base}/${q.quote}`;
    await soft.check(`${label} base`, () => expect(q.base).toMatch(utils.SYMBOL));
    await soft.check(`${label} quote`, () => expect(q.quote).toMatch(/^[A-Z]{3,5}$/));
    await soft.check(`${label} close`, () => expect(q.close).toBeGreaterThan(0));
    await soft.check(`${label} high >= low`, () => expect(q.high).toBeGreaterThanOrEqual(q.low));
  }
  soft.assertAll('Price feed');
});

Then('every quote is less than {int} hours old', async function (hours) {
  const nowSec = Date.now() / 1000;
  const soft = new SoftAssert();
  for (const q of this.ctx.priceQuotes || []) {
    // A stale feed on a trading platform is a real incident
    await soft.check(`${q.base}/${q.quote} age`, () => expect(nowSec - q.timestamp).toBeLessThan(hours * 3600));
  }
  soft.assertAll('Stale quotes');
});

Then('spot market prices are within {int}% of the price feed', async function (pct) {
  await Promise.all(this.ctx.pending);
  const soft = new SoftAssert();
  let compared = 0;
  for (const row of await this.poManager.explorePage.table.readRows()) {
    const quote = (this.ctx.priceQuotes || []).find((q) => q.base === row.symbol);
    const uiPrice = utils.parsePrice(row.priceCell);
    if (!quote || uiPrice < 1) continue; // sub-cent assets are rounded to $0.00 in the UI (see README)
    compared++;
    await soft.check(`${row.symbol} UI ${uiPrice} vs API ${quote.close}`, () =>
      expect(Math.abs(uiPrice - quote.close) / quote.close).toBeLessThan(pct / 100),
    );
  }
  expect(compared, 'no assets could be compared with the feed').toBeGreaterThan(0);
  soft.assertAll('UI vs price feed');
});
