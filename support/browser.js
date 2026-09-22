/**
 * Browser lifecycle, kept separate from hooks (same split as the reference framework).
 *
 * Environment variables:
 *   BROWSER        chromium (default) | chrome | firefox | webkit
 *   HEADLESS       true | false  (default: false locally, true when CI is set)
 *   SLOWMO         ms pause between actions, to watch a run
 *   MOBILE_DEVICE  device used for @mobile scenarios (default "Pixel 7")
 *   PROXY_SERVER   regional proxy, e.g. http://host:port
 */
const { chromium, firefox, webkit, devices } = require('@playwright/test');

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

/** Analytics, tag managers, consent CDN: irrelevant to the checks and the main source of flakiness. */
const THIRD_PARTY_NOISE =
  /googletagmanager|google-analytics|analytics\.google|doubleclick|facebook\.net|journify|cookiebot|hotjar|clarity\.ms|intercom|tiktok/i;

function resolveBrowser(isMobile) {
  if (isMobile) {
    const deviceName = process.env.MOBILE_DEVICE || 'Pixel 7';
    const device = devices[deviceName];
    if (!device) throw new Error(`Unknown MOBILE_DEVICE "${deviceName}"`);
    const type = { chromium, firefox, webkit }[device.defaultBrowserType];
    return { type, channel: undefined, contextOptions: device, label: deviceName };
  }
  const name = (process.env.BROWSER || 'chromium').toLowerCase();
  const map = {
    chromium: { type: chromium },
    chrome: { type: chromium, channel: 'chrome' }, // installed Google Chrome
    firefox: { type: firefox },
    webkit: { type: webkit },
  };
  if (!map[name]) throw new Error(`Unknown BROWSER "${name}". Use: ${Object.keys(map).join(', ')}`);
  return { ...map[name], contextOptions: { viewport: DESKTOP_VIEWPORT }, label: name };
}

/**
 * Launches a fresh browser + context + page for one scenario.
 * @param {{ isMobile?: boolean }} options
 */
async function launchBrowser({ isMobile = false } = {}) {
  const { type, channel, contextOptions, label } = resolveBrowser(isMobile);
  const headless = process.env.HEADLESS ? process.env.HEADLESS === 'true' : !!process.env.CI;

  const browser = await type.launch({
    headless,
    channel,
    slowMo: Number(process.env.SLOWMO || 0),
  });

  const context = await browser.newContext({
    ...contextOptions,
    locale: 'en-AE',
    timezoneId: 'Asia/Dubai',
    proxy: process.env.PROXY_SERVER ? { server: process.env.PROXY_SERVER } : undefined,
  });
  context.setDefaultTimeout(15_000);
  context.setDefaultNavigationTimeout(45_000);

  // Trace = step-by-step replay of the scenario; saved only when it fails (see hooks.js)
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  await context.route(THIRD_PARTY_NOISE, (route) => route.abort());

  const page = await context.newPage();

  // Privacy-preserving choice (Deny), scoped to the consent dialog so it can never click an app button.
  // Fires only if a cookie banner blocks an action.
  const deny = page
    .locator('#CybotCookiebotDialog, [id*="cookie" i], [class*="consent" i]')
    .getByRole('button', { name: /^(deny|reject all|decline|use necessary cookies only)$/i })
    .first();
  await page.addLocatorHandler(deny, (btn) => btn.click(), { noWaitAfter: true });

  const consoleLogs = [];
  const pageErrors = [];
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => pageErrors.push(err));

  return { browser, context, page, consoleLogs, pageErrors, label };
}

async function closeBrowser(browser) {
  if (!browser) return;
  try {
    await browser.close();
  } catch (e) {
    console.warn('Error closing browser:', e.message || e);
  }
}

module.exports = { launchBrowser, closeBrowser };
