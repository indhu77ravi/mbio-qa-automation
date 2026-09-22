/**
 * Soft assertions for cucumber-js.
 * Playwright's expect.soft only works inside the Playwright test runner; under
 * cucumber-js it throws on the first failure. This collects every failure in a
 * step and reports them together, so one run shows ALL bad rows, not just the first.
 *
 *   const soft = new SoftAssert();
 *   for (const row of rows) await soft.check(`${row.symbol} price`, () => expect(row.price).toBeGreaterThan(0));
 *   soft.assertAll('Spot market prices');
 */
class SoftAssert {
  constructor() {
    this.failures = [];
  }

  async check(label, assertion) {
    try {
      await assertion();
    } catch (error) {
      const detail = String(error.message)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(' | ');
      this.failures.push(`${label}: ${detail}`);
    }
  }

  assertAll(title = 'Soft assertions') {
    if (this.failures.length) {
      throw new Error(`${title}: ${this.failures.length} check(s) failed\n  - ${this.failures.join('\n  - ')}`);
    }
  }
}

module.exports = { SoftAssert };
