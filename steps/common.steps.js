/**
 * Steps shared across features: opening pages, network recording, page health.
 * Page objects hold the "how"; steps express intent.
 */
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { playwrightUtils } = require('./playwrightUtils');
const { utils } = require('./utils');
const { rx } = require('../support/testData');
const { logStep } = require('./allurelogger');

// ---------- opening pages ----------

Given('I am on the home page', async function () {
  this.ctx.response = await logStep('Open home page', () => this.poManager.homePage.open());
});

Given('I am on the explore page', async function () {
  this.ctx.response = await logStep('Open explore page', () => this.poManager.explorePage.open());
});

When('I open the explore page', async function () {
  this.ctx.response = await this.poManager.explorePage.open();
});

When('I reload the explore page', async function () {
  this.ctx.response = await this.poManager.explorePage.open();
});

Given('I am on the Why MultiBank page', async function () {
  this.ctx.response = await logStep('Open Why MultiBank page', () => this.poManager.companyPage.open());
  expect(this.ctx.response?.status(), 'HTTP status').toBeLessThan(400);
});

Given('my screen is {int} by {int} pixels', async function (width, height) {
  await this.page.setViewportSize({ width, height });
});

When('I scroll through the whole page', async function () {
  await playwrightUtils.scrollThroughPage(this.page);
});

// ---------- network recording ----------

Given('I am recording market data traffic', async function () {
  const { ctx, data } = this;
  this.page.on('response', (res) => {
    const url = res.url();
    const isApi = ['fetch', 'xhr'].includes(res.request().resourceType());
    if (isApi && rx(data.ownedHostsPattern).test(new URL(url).host) && res.status() >= 400) {
      ctx.failedApiCalls.push(`${res.status()} ${res.request().method()} ${url.split('?')[0]}`);
    }
    if (res.ok() && rx(data.api.categoriesPattern).test(url)) {
      ctx.pending.push(res.json().then((j) => (ctx.apiCategories = j)).catch(() => undefined));
    }
    if (res.ok() && rx(data.api.pricesPattern).test(url)) {
      ctx.pending.push(res.json().then((j) => (ctx.priceQuotes = j)).catch(() => undefined));
    }
  });
});

// ---------- page health ----------

Then('the page does not scroll horizontally', async function () {
  expect(await playwrightUtils.hasHorizontalOverflow(this.page), 'page scrolls sideways').toBe(false);
});

Then('no JavaScript errors occurred', async function () {
  expect(this.pageErrors.map((e) => e.message)).toEqual([]);
});

Then('no broken values are shown', async function () {
  await expect(this.page.locator('body')).not.toContainText(utils.BROKEN_VALUE);
});

Then('no image on the page is broken', async function () {
  expect(await playwrightUtils.brokenImages(this.page.locator('body'))).toEqual([]);
});

Then('the main navigation is still available', async function () {
  await expect(this.poManager.homePage.header.nav).toBeVisible();
});
