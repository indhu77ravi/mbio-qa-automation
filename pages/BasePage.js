const Header = require('./components/Header');
const Footer = require('./components/Footer');
const { data, pageUrl } = require('../support/testData');

/**
 * Shared behaviour for every page: locale-aware navigation, readiness,
 * geo-redirect detection, and the header/footer regions.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} path path without locale, e.g. "/explore"
   */
  constructor(page, path) {
    this.page = page;
    this.path = path;
    this.header = new Header(page);
    this.footer = new Footer(page);
  }

  get url() {
    return pageUrl(this.path);
  }

  async open() {
    const response = await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    this.assertNotGeoRedirected();
    await this.waitUntilReady();
    return response;
  }

  /** Default readiness: the header is visible. Subclasses override. Never a fixed sleep. */
  async waitUntilReady() {
    await this.header.root.waitFor({ state: 'visible' });
  }

  /**
   * Innermost visible element containing ALL given texts: targets a "card"
   * without depending on generated CSS classes.
   */
  block(...parts) {
    let locator = this.page.locator('section, article, li, div, a');
    for (const part of parts) locator = locator.filter({ hasText: part });
    return locator.filter({ visible: true }).last();
  }

  /**
   * mb.io redirects by IP (e.g. /en-AE -> /en outside the UAE). Fail fast with a
   * clear message instead of dozens of confusing failures.
   */
  assertNotGeoRedirected() {
    const { pathname } = new URL(this.page.url());
    if (!pathname.startsWith(data.localePath)) {
      throw new Error(
        `Geo-redirected: requested ${this.url} but landed on ${pathname}. ` +
          'Run from the target region, set PROXY_SERVER to a proxy there, or use TARGET=global.',
      );
    }
  }
}

module.exports = BasePage;
