const HomePage = require('./HomePage');
const ExplorePage = require('./ExplorePage');
const CompanyPage = require('./CompanyPage');

/**
 * Single entry point to all page objects for a scenario (created in the Before hook).
 * Steps use: this.poManager.homePage, this.poManager.explorePage, this.poManager.companyPage
 */
class PageObjectManager {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.homePage = new HomePage(page);
    this.explorePage = new ExplorePage(page);
    this.companyPage = new CompanyPage(page);
  }

  /** Looks a page object up by the name used in feature files. */
  byName(name) {
    const map = { home: this.homePage, explore: this.explorePage, company: this.companyPage };
    if (!map[name]) throw new Error(`Unknown page "${name}". Use: ${Object.keys(map).join(', ')}`);
    return map[name];
  }
}

module.exports = PageObjectManager;
