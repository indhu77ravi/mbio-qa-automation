const { expect } = require('@playwright/test');
const { readEntries } = require('./assets');

/**
 * Explore page market table. It has no <th> headers, so columns are positional:
 * [asset (symbol + name), price, 24h change, 7-day chart].
 * Identified by containing asset links, not by CSS classes.
 */
class MarketTable {
  constructor(page) {
    this.page = page;
    this.root = page.getByRole('table').filter({ has: page.locator('a[href*="explore/"]') }).first();
    this.rows = this.root.locator('tbody tr');
  }

  /** Waits for real data rows (placeholder rows render without digits). */
  async waitForData(min = 1, timeout = 30_000) {
    await expect
      .poll(() => this.rows.filter({ hasText: /\d/ }).count(), {
        message: `expected at least ${min} populated market rows`,
        timeout,
      })
      .toBeGreaterThanOrEqual(min);
  }

  async readRows() {
    const entries = await readEntries(this.rows);
    const cells = await this.rows.evaluateAll((trs) =>
      trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.innerText.replace(/\s+/g, ' ').trim())),
    );
    return entries.map((e, i) => ({
      ...e,
      assetCell: cells[i]?.[0] || '',
      priceCell: cells[i]?.[1] || '',
      changeCell: cells[i]?.[2] || '',
    }));
  }

  async symbols() {
    return (await readEntries(this.rows)).map((e) => e.symbol);
  }

  row(symbol) {
    return this.rows.filter({ has: this.page.locator(`a[href$="/explore/${symbol}"]`) });
  }
}

module.exports = MarketTable;
