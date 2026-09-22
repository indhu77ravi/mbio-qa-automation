const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { checkLink, normaliseLinks } = require('./linkUtils');
const { logTestData, logInfo } = require('./allurelogger');
const { data, rx, pageUrl } = require('../support/testData');

const notFoundHeading = () => rx(data.notFound.headingPattern, 'i');

// ---------- invalid routes ----------

When('I open a page that does not exist', async function () {
  this.ctx.response = await this.page.goto(pageUrl(`${data.notFound.route}-${Date.now()}`));
});

When('I open a malformed URL', async function () {
  this.ctx.response = await this.page.goto(pageUrl('/%E0%A4%A'));
});

Then('the server responds with status {int}', async function (status) {
  expect(this.ctx.response?.status()).toBe(status);
});

Then('the server does not return a 5xx error', async function () {
  expect(this.ctx.response?.status() || 0).toBeLessThan(500);
});

Then('I see the {string} message', async function (text) {
  await expect(this.page.getByRole('heading', { name: text })).toBeVisible();
});

When('I select {string}', async function (name) {
  await this.page.getByRole('link', { name, exact: true }).click();
});

Then('I am on a home page', async function () {
  await expect(this.page.getByRole('heading', { name: notFoundHeading() })).toBeHidden();
  await expect(this.page).toHaveURL(/mb\.io\/[a-z]{2}(-[A-Z]{2})?\/?$/);
});

/**
 * @known-bug scenarios are excluded from normal runs (see cucumber.js) and run with
 * `npm run test:known-bugs`, where they are EXPECTED to fail until the bug is fixed.
 */
Given('known bug {string} is still open for this region', async function (id) {
  await logInfo('Known bug', `${id}: expected to fail on ${data.localePath} until fixed`);
});

Then('the {string} link keeps the locale prefix', async function (name) {
  await expect(this.page.getByRole('link', { name, exact: true })).toHaveAttribute(
    'href',
    new RegExp(`^${data.localePath}/?$`),
  );
});

Then('the page shows no stack trace or server error details', async function () {
  await expect(this.page.locator('body')).not.toContainText(
    /at \w+ \(.*:\d+:\d+\)|Traceback|Exception:|ECONNREFUSED|Internal Server Error/,
  );
});

// ---------- broken links ----------

When('I check every header and footer link', { timeout: 180_000 }, async function () {
  const { header, footer } = this.poManager.homePage;
  const hrefs = [...(await header.linkHrefs()), ...(await footer.linkHrefs())];
  const skip = rx(data.brokenLinks.skipHostsPattern);
  const urls = normaliseLinks(hrefs, this.page.url()).filter((u) => !skip.test(new URL(u).host));
  expect(urls.length, 'no links found').toBeGreaterThan(5);

  // Small concurrency pool: fast, but polite to the target
  const results = [];
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (queue.length) results.push(await checkLink(this.page.request, queue.shift()));
    }),
  );
  this.ctx.linkResults = results;
  await logTestData('Link report', results);
});

Then('no link is broken', async function () {
  const broken = this.ctx.linkResults.filter((r) => !r.ok).map((r) => `${r.status} ${r.url} ${r.error || ''}`.trim());
  expect(broken, `${broken.length}/${this.ctx.linkResults.length} broken`).toEqual([]);
});

// ---------- loading failures ----------

Given('the market data API times out', async function () {
  await this.page.route(rx(data.api.marketDataPattern), (route) => route.abort('timedout'));
});

Given('the market data API responds after {int} seconds', async function (seconds) {
  await this.page.route(rx(data.api.marketDataPattern), async (route) => {
    await new Promise((r) => setTimeout(r, seconds * 1000)); // simulated latency, not a test sleep
    await route.continue();
  });
});

Then('the page heading and navigation still work', async function () {
  await expect(this.poManager.explorePage.heading).toBeVisible();
  await expect(this.poManager.explorePage.header.nav).toBeVisible();
});

// ---------- mobile ----------

Then('the first spot market entry is on screen', async function () {
  await expect(this.poManager.explorePage.table.rows.first()).toBeInViewport();
});
