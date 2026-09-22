/**
 * Reusable browser helpers (same role as playwrightUtils in the reference framework).
 */
class playwrightUtils {
  /** Clicks a locator that opens a new tab and returns the new page. */
  static async switchToNewWindow(page, locator) {
    const popupPromise = page.waitForEvent('popup', { timeout: 20_000 });
    await locator.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    console.log('Opened new window:', await popup.title());
    return popup;
  }

  static async closePopupWindow(popup) {
    if (popup && !popup.isClosed()) await popup.close();
  }

  /** True when the document is wider than the viewport (user can scroll sideways). */
  static async hasHorizontalOverflow(page) {
    return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  }

  /** Top of an element relative to the document (not the viewport). */
  static async documentTop(locator) {
    return locator.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  }

  /** Sources of <img> elements inside `locator` that failed to decode. */
  static async brokenImages(locator) {
    return locator.evaluate((root) =>
      Array.from(root.querySelectorAll('img'))
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
  }

  /** Scrolls top to bottom in viewport steps so lazy-loaded content is requested. */
  static async scrollThroughPage(page) {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
    });
    await page.waitForLoadState('load');
  }
}

module.exports = { playwrightUtils };
