const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const MarketTable = require('./components/MarketTable');
const { data, rx } = require('../support/testData');

/** Explore page: promo banners and the spot market table with category filters. */
class ExplorePage extends BasePage {
  constructor(page) {
    super(page, data.explore.path);
    this.heading = page.getByRole('heading', { level: 1, name: rx(data.explore.headingPattern, 'i') });
    this.table = new MarketTable(page);
  }

  async waitUntilReady() {
    await this.heading.waitFor({ state: 'visible' });
  }

  category(label) {
    return this.page.getByRole('button', { name: label, exact: true });
  }

  banner(textPattern) {
    return this.block(textPattern);
  }

  bannerLink(textPattern) {
    return this.page.getByRole('link').filter({ hasText: textPattern }).filter({ visible: true }).first();
  }

  /** Selects a category and waits until it is active and the table has data. */
  async selectCategory(label) {
    const button = this.category(label);
    await button.click();
    await expect
      .poll(() => ExplorePage.isActive(button), { message: `category "${label}" did not become active` })
      .toBe(true);
    await this.table.waitForData(1);
  }

  /**
   * The buttons expose no aria-pressed/aria-selected (an accessibility gap, see README),
   * so ARIA state is checked first and the styling class is the fallback.
   */
  static async isActive(button) {
    const state = await button.evaluate((el) => ({
      aria: el.getAttribute('aria-pressed') ?? el.getAttribute('aria-selected'),
      cls: el.className,
    }));
    return state.aria === 'true' || rx(data.ui.activeCategoryClassPattern).test(state.cls);
  }
}

module.exports = ExplorePage;
