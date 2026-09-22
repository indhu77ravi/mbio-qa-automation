const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { playwrightUtils } = require('./playwrightUtils');
const { SoftAssert } = require('./softAssert');
const { data, rx } = require('../support/testData');

function navItem(label) {
  const item = data.navigation.items.find((i) => i.label === label);
  if (!item) throw new Error(`"${label}" is not a nav item in the "${data.name}" profile`);
  return item;
}

function authLink(label) {
  const link = data.navigation.authLinks.find((l) => l.label === label);
  if (!link) throw new Error(`"${label}" is not an account link in the "${data.name}" profile`);
  return link;
}

Then('I see the site logo', async function () {
  await expect(this.poManager.homePage.header.logo).toBeVisible();
});

Then('the main navigation shows these items:', async function (table) {
  const soft = new SoftAssert();
  for (const [label] of table.raw()) {
    await soft.check(`nav item "${label}"`, () => expect(this.poManager.homePage.header.item(label)).toBeVisible());
  }
  soft.assertAll('Main navigation');
});

Then('every internal navigation link keeps the locale prefix', async function () {
  const soft = new SoftAssert();
  for (const item of data.navigation.items.filter((i) => !i.newTab)) {
    await soft.check(`"${item.label}"`, () =>
      expect(this.poManager.homePage.header.item(item.label)).toHaveAttribute(
        'href',
        new RegExp(`^${data.localePath}/`),
      ),
    );
  }
  soft.assertAll(`Links dropping ${data.localePath}`);
});

Then('the {string} link points to the trading app login', async function (label) {
  await expect(this.poManager.homePage.header.authLink(label)).toHaveAttribute('href', rx(authLink(label).hrefPattern));
});

Then('the {string} link points to the trading app registration', async function (label) {
  await expect(this.poManager.homePage.header.authLink(label)).toHaveAttribute('href', rx(authLink(label).hrefPattern));
});

When('I select {string} in the main navigation', async function (label) {
  const link = this.poManager.homePage.header.item(label);
  if (navItem(label).newTab) {
    await expect(link).toHaveAttribute('target', '_blank');
    this.ctx.activePage = await playwrightUtils.switchToNewWindow(this.page, link);
  } else {
    await link.click();
    this.ctx.activePage = this.page;
  }
});

Then('I land on the {string} destination', async function (label) {
  const target = this.activePage;
  await expect(target).toHaveURL(rx(navItem(label).urlPattern));
  if (target === this.page) {
    // Really rendered: not the 404 page, and the site shell is intact
    await expect(this.page.getByRole('heading', { name: rx(data.notFound.headingPattern, 'i') })).toBeHidden();
    await expect(this.poManager.homePage.header.nav).toBeVisible();
  } else {
    await playwrightUtils.closePopupWindow(target);
    this.ctx.activePage = this.page;
  }
});

// ---------- layout ----------

Then('the menu button is hidden', async function () {
  await expect(this.poManager.homePage.header.menuButton).toBeHidden();
});

Then('every navigation item is inside the viewport', async function () {
  const soft = new SoftAssert();
  for (const { label } of data.navigation.items) {
    await soft.check(label, () => expect(this.poManager.homePage.header.item(label)).toBeInViewport());
  }
  soft.assertAll('Navigation items outside the viewport');
});

Then('no navigation items overlap', async function () {
  const boxes = [];
  for (const { label } of data.navigation.items) {
    const box = await this.poManager.homePage.header.item(label).boundingBox();
    if (box) boxes.push({ label, ...box });
  }
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const [a, b] = [boxes[i], boxes[j]];
      if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) {
        overlaps.push(`"${a.label}" overlaps "${b.label}"`);
      }
    }
  }
  expect(overlaps).toEqual([]);
});

// ---------- mobile ----------

Then('the main navigation is collapsed', async function () {
  await expect(this.poManager.homePage.header.nav).toBeHidden();
  await expect(this.poManager.homePage.header.menuButton).toBeVisible();
});

When('I open the menu', async function () {
  await this.poManager.homePage.header.menuButton.click();
  await expect(this.poManager.homePage.header.mobileMenu).toBeVisible();
});

Then('the menu shows these items:', async function (table) {
  const soft = new SoftAssert();
  for (const [label] of table.raw()) {
    await soft.check(label, () => expect(this.poManager.homePage.header.mobileItem(label)).toBeVisible());
  }
  soft.assertAll('Mobile menu');
});
