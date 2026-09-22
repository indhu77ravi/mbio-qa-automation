const { data } = require('../../support/testData');

/**
 * Site header. Locators use role + accessible name, scoped to <nav aria-label="Main">,
 * so they survive restyling (the site's CSS classes are generated utility classes).
 */
class Header {
  constructor(page) {
    this.page = page;
    this.root = page.locator('header').first();
    this.nav = this.root.getByRole('navigation', { name: 'Main' });
    this.logo = this.root.getByRole('link', { name: data.navigation.logoName, exact: true });
    this.menuButton = this.root.getByRole('button', { name: data.navigation.menuButtonName });
    /** The mobile menu opens as a dialog (aria-haspopup="dialog"). */
    this.mobileMenu = page.getByRole('dialog');
  }

  item(label) {
    return this.nav.getByRole('link', { name: label, exact: true });
  }

  authLink(label) {
    return this.root.getByRole('link', { name: label, exact: true });
  }

  mobileItem(label) {
    return this.mobileMenu.getByRole('link', { name: label, exact: true });
  }

  async linkHrefs() {
    return this.root.getByRole('link').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  }
}

module.exports = Header;
