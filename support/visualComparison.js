/**
 * Visual regression with baseline/compare modes (same approach as the reference framework).
 *
 *   VISUAL_MODE=baseline  -> capture and save baselines (before a deployment)
 *   (unset / compare)     -> compare against saved baselines (after a deployment)
 *
 * Images live in TestData/visualRegression/{baseline,actual,diff}.
 * Live market data can be masked so price ticks never cause a diff.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const ROOT = path.join(__dirname, '../TestData/visualRegression');
const DIRS = { baseline: path.join(ROOT, 'baseline'), actual: path.join(ROOT, 'actual'), diff: path.join(ROOT, 'diff') };
Object.values(DIRS).forEach((d) => fs.mkdirSync(d, { recursive: true }));

const isBaselineMode = process.env.VISUAL_MODE === 'baseline';
/** Allowed share of differing pixels, in percent (anti-aliasing noise). */
const MAX_DIFF_PERCENT = Number(process.env.VISUAL_MAX_DIFF_PERCENT || 0.1);
const SETTLE_MS = Number(process.env.VISUAL_SETTLE_MS || 800);

async function waitForVisualStability(page, locator) {
  await page.waitForLoadState('load').catch(() => null);
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => null);
  await page
    .waitForFunction(() => Array.from(document.images).every((img) => img.complete), null, { timeout: 15_000 })
    .catch(() => null);
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;
      transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important;caret-color:transparent!important}`,
  });
  if (locator) await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(SETTLE_MS); // visual only: let late layout shifts settle
}

/**
 * Screenshot a component (locator) or the page, then save it as baseline or compare with the baseline.
 * @param {import('@playwright/test').Page} page
 * @param {string} name unique snapshot name (file name)
 * @param {{ locator?: import('@playwright/test').Locator, mask?: import('@playwright/test').Locator[],
 *           fullPage?: boolean, attach?: Function }} options
 */
async function captureAndCompare(page, name, { locator, mask = [], fullPage = false, attach } = {}) {
  const file = `${name}.png`;
  await waitForVisualStability(page, locator);

  const shotOptions = { type: 'png', mask, maskColor: '#FF00FF' };
  const actual = locator ? await locator.screenshot(shotOptions) : await page.screenshot({ ...shotOptions, fullPage });
  const named = (body, mediaType, fileName) => attach && attach(body, { mediaType, fileName });

  if (isBaselineMode) {
    fs.writeFileSync(path.join(DIRS.baseline, file), actual);
    named(actual, 'image/png', `Baseline captured: ${name}`);
    return { passed: true, mode: 'baseline' };
  }

  const baselinePath = path.join(DIRS.baseline, file);
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`[VISUAL] No baseline for "${name}". Run "npm run visual:baseline" first.\nExpected: ${baselinePath}`);
  }
  fs.writeFileSync(path.join(DIRS.actual, file), actual);

  const base = PNG.sync.read(fs.readFileSync(baselinePath));
  const act = PNG.sync.read(actual);
  named(fs.readFileSync(baselinePath), 'image/png', `Baseline: ${name}`);
  named(actual, 'image/png', `Actual: ${name}`);

  if (base.width !== act.width || base.height !== act.height) {
    const msg = `Size changed for "${name}": baseline ${base.width}x${base.height}, actual ${act.width}x${act.height}`;
    named(msg, 'text/plain', `Size mismatch: ${name}`);
    return { passed: false, mode: 'compare', message: msg };
  }

  const diff = new PNG({ width: base.width, height: base.height });
  const diffPixels = pixelmatch(base.data, act.data, diff.data, base.width, base.height, { threshold: 0.1 });
  const diffPercent = (diffPixels / (base.width * base.height)) * 100;
  const diffBuffer = PNG.sync.write(diff);
  fs.writeFileSync(path.join(DIRS.diff, file), diffBuffer);
  named(diffBuffer, 'image/png', `Diff: ${name}`);

  const passed = diffPercent <= MAX_DIFF_PERCENT;
  const message = `${diffPixels} pixels differ (${diffPercent.toFixed(3)}%, allowed ${MAX_DIFF_PERCENT}%)`;
  console.log(`[VISUAL ${passed ? 'PASS' : 'FAIL'}] ${name}: ${message}`);
  return { passed, mode: 'compare', message };
}

module.exports = { captureAndCompare, isBaselineMode };
