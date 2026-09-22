const { readEntries } = require('./assets');

/** Home page widget such as "Top Gainers": a heading plus a list of asset links. */
class MoversWidget {
  constructor(page, heading) {
    // Innermost container holding both the heading and asset links
    this.root = page
      .locator('section, div')
      .filter({ has: page.getByRole('heading', { name: heading, exact: true }) })
      .filter({ has: page.locator('a[href*="explore/"]') })
      .last();
    this.items = this.root.locator('a[href*="explore/"]');
  }

  read() {
    return readEntries(this.items);
  }
}

module.exports = MoversWidget;
