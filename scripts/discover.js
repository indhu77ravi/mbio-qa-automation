/**
 * Discovery helper: dumps what the live site renders right now (nav, category
 * buttons, table sample, footer links, headings, market API calls) so test-data
 * can be refreshed in minutes after a front-end release.
 *
 *   npm run discover              # https://mb.io/en-AE
 *   TARGET=global npm run discover
 */
const { chromium } = require('@playwright/test');
const { mkdirSync, writeFileSync } = require('node:fs');

(async () => {

const locale = process.env.TARGET === 'global' ? '/en' : '/en-AE';
const base = (process.env.BASE_URL ?? 'https://mb.io') + locale;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-AE' });
const apiCalls = new Set();
page.on('request', (r) => {
  if (['fetch', 'xhr'].includes(r.resourceType()) && /mb\.io\/api/.test(r.url()))
    apiCalls.add(r.url().split('?')[0]);
});

async function snapshot(path) {
  const response = await page
    .goto(base + path, { waitUntil: 'networkidle', timeout: 60_000 })
    .catch(() => null);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500); // discovery only: let lazy content render
  return page.evaluate((status) => {
    const text = (el) => el.innerText.replace(/\s+/g, ' ').trim();
    const links = (root) =>
      root ? [...root.querySelectorAll('a')].map((a) => `${text(a)} -> ${a.getAttribute('href')}`) : [];
    return {
      url: location.href,
      status,
      title: document.title,
      mainNav: links(document.querySelector('nav[aria-label="Main"]')),
      footer: links(document.querySelector('footer')),
      buttons: [...document.querySelectorAll('main button, button')]
        .map(text)
        .filter((t) => t && t.length < 20),
      tableSample: [...document.querySelectorAll('table tbody tr')]
        .slice(0, 5)
        .map((tr) => [...tr.querySelectorAll('td')].map(text).join(' | ')),
      downloadLinks: [...document.querySelectorAll('a')]
        .map((a) => a.href)
        .filter((h) => /go\.link|apple|google/.test(h)),
      headings: [...document.querySelectorAll('h1, h2, h3')].map(
        (h) => `${h.tagName}: ${text(h).slice(0, 90)}`,
      ),
    };
  }, response?.status() ?? null);
}

const result = { capturedAt: new Date().toISOString(), base };
for (const [name, path] of Object.entries({
  home: '',
  explore: '/explore',
  company: '/company',
  notFound: '/qa-404-probe',
})) {
  result[name] = await snapshot(path);
}
result.marketApis = [...apiCalls];
await browser.close();

if (!new URL(result.home.url).pathname.startsWith(locale)) {
  console.warn(
    `\n⚠ Geo-redirected to ${result.home.url}. Run from the target region or set BASE_URL/TARGET.\n`,
  );
}
mkdirSync('reports', { recursive: true });
writeFileSync('reports/discovery.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log('\nSaved to reports/discovery.json');
})();
