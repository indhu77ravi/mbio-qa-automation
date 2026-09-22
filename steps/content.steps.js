const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { utils } = require('./utils');
const { playwrightUtils } = require('./playwrightUtils');
const { SoftAssert } = require('./softAssert');
const { checkLink, resolveStoreLink, USER_AGENTS } = require('./linkUtils');
const { logInfo } = require('./allurelogger');
const { data, rx, pageUrl } = require('../support/testData');

// ---------- banners ----------

Then('these banners are visible:', async function (table) {
  const soft = new SoftAssert();
  for (const [text] of table.raw()) {
    await soft.check(`banner "${text}"`, () => expect(this.poManager.explorePage.banner(utils.literal(text))).toBeVisible());
  }
  soft.assertAll('Banners');
});

Then('every banner is below the page heading and above the spot market', async function () {
  const explore = this.poManager.explorePage;
  const headingTop = await playwrightUtils.documentTop(explore.heading);
  const tableTop = await playwrightUtils.documentTop(explore.table.root);
  const soft = new SoftAssert();
  for (const { textPattern } of data.banners) {
    const top = await playwrightUtils.documentTop(explore.banner(rx(textPattern, 'i')));
    await soft.check(`"${textPattern}" below heading`, () => expect(top).toBeGreaterThanOrEqual(headingTop));
    await soft.check(`"${textPattern}" above spot market`, () => expect(top).toBeLessThan(tableTop));
  }
  soft.assertAll('Banner positions');
});

Then('every banner call-to-action points to the trading app', async function () {
  const soft = new SoftAssert();
  for (const banner of data.banners.filter((b) => b.hrefPattern)) {
    await soft.check(`"${banner.textPattern}" CTA`, () =>
      expect(this.poManager.explorePage.bannerLink(rx(banner.textPattern, 'i'))).toHaveAttribute('href', rx(banner.hrefPattern)),
    );
  }
  soft.assertAll('Banner CTAs');
});

Then('no banner has a broken image', async function () {
  const soft = new SoftAssert();
  for (const { textPattern } of data.banners) {
    const broken = await playwrightUtils.brokenImages(this.poManager.explorePage.banner(rx(textPattern, 'i')));
    await soft.check(`"${textPattern}"`, () => expect(broken).toEqual([]));
  }
  soft.assertAll('Banner images');
});

// ---------- app download ----------

Then('the {string} link is visible and points to the smart link', async function (_name) {
  const link = this.poManager.homePage.downloadAppLink;
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', rx(data.appDownload.hrefPattern));
});

When('I follow the download link as a(n) {word} user', async function (device) {
  const store = Object.values(data.appDownload.stores).find((s) => s.device === device);
  if (!store) throw new Error(`Unknown device "${device}". Use: iPhone, Android`);
  const href = await this.poManager.homePage.downloadAppLink.getAttribute('href');
  this.ctx.storeResult = await resolveStoreLink(this.page.request, href, USER_AGENTS[device], rx(store.urlPattern));
  await logInfo('Smart link resolved', `${this.ctx.storeResult.storeUrl} (via ${this.ctx.storeResult.via})`);
});

Then('I reach the {string} listing', async function (storeName) {
  const store = data.appDownload.stores[storeName];
  if (!store) throw new Error(`Unknown store "${storeName}". Use: ${Object.keys(data.appDownload.stores).join(', ')}`);
  expect(this.ctx.storeResult?.storeUrl, `smart link did not lead to ${storeName}`).toMatch(rx(store.urlPattern));
  expect(this.ctx.storeResult?.status, `${storeName} listing HTTP status`).toBeLessThan(400);
});

// ---------- Why MultiBank (Company page) ----------

Then('I see the {string} page', async function (heading) {
  await expect(this.page).toHaveURL(new RegExp(`${data.localePath}${data.company.path}/?$`));
  await expect(this.page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
});

Then('the page has a single main heading {string}', async function (heading) {
  const h1 = this.page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText(heading);
});

Then('the introduction is visible', async function () {
  await expect(this.poManager.companyPage.intro).toBeVisible();
});

Then('these key figures are shown:', async function (table) {
  const soft = new SoftAssert();
  for (const { value, label } of table.hashes()) {
    await soft.check(`${value} ${label}`, () => expect(this.poManager.companyPage.stat(value, label)).toBeVisible());
  }
  soft.assertAll('Key figures');
});

Then('the {string} section is shown with its text', async function (heading) {
  const body = data.company.sections[heading];
  if (!body) throw new Error(`No section "${heading}" in the "${data.name}" profile`);
  await expect(this.poManager.companyPage.sectionHeading(heading)).toBeVisible();
  await expect(this.poManager.companyPage.section(heading, body)).toBeVisible();
});

Then('these strength cards are shown:', async function (table) {
  const soft = new SoftAssert();
  for (const [title] of table.raw()) {
    const card = this.poManager.companyPage.strength(title, data.company.strengths[title] || '\\w');
    await card.scrollIntoViewIfNeeded().catch(() => undefined);
    await soft.check(title, () => expect(card).toBeVisible());
  }
  soft.assertAll('Strength cards');
});

Then('the {string} link points to the contact page', async function (_name) {
  await expect(this.poManager.companyPage.cta).toHaveAttribute('href', rx(data.company.ctaHrefPattern));
});

// ---------- regulatory footer ----------

Then('the footer links every regulatory document required in this region', async function () {
  const soft = new SoftAssert();
  for (const doc of data.footer.requiredLinks) {
    await soft.check(doc.label, () =>
      expect(this.poManager.homePage.footer.link(doc.label)).toHaveAttribute('href', rx(doc.hrefPattern)),
    );
  }
  soft.assertAll(`Regulatory documents (${data.name})`);
});

Then('every required regulatory document responds successfully', async function () {
  const failures = [];
  for (const doc of data.footer.requiredLinks) {
    const href = await this.poManager.homePage.footer.link(doc.label).getAttribute('href');
    const result = await checkLink(this.page.request, new URL(href, pageUrl()).toString());
    if (!result.ok) failures.push(`${doc.label}: HTTP ${result.status}`);
  }
  expect(failures).toEqual([]);
});
