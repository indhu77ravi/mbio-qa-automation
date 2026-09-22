/**
 * HTTP link checks via Playwright's request context (no clicking into third-party sites).
 */
const USER_AGENTS = {
  iPhone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  Android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
};

/** HEAD first, GET when the server rejects HEAD. Follows redirects. */
async function checkLink(request, url, userAgent) {
  const headers = userAgent ? { 'user-agent': userAgent } : undefined;
  try {
    let res = await request.head(url, { headers, maxRedirects: 10, timeout: 20_000 });
    if ([403, 405, 501].includes(res.status())) {
      res = await request.get(url, { headers, maxRedirects: 10, timeout: 20_000 });
    }
    return { url, status: res.status(), finalUrl: res.url(), ok: res.status() < 400 };
  } catch (e) {
    return { url, status: 0, finalUrl: url, ok: false, error: e.message };
  }
}

/** http(s) links only, without fragments, de-duplicated. */
function normaliseLinks(hrefs, base) {
  const out = new Set();
  for (const href of hrefs) {
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    const url = new URL(href, base);
    url.hash = '';
    if (url.protocol.startsWith('http')) out.add(url.toString());
  }
  return [...out];
}

/**
 * Resolves a device-routing smart link (e.g. mbio.go.link) the way a phone would:
 * via HTTP redirect, or via a landing page that contains the store URL.
 */
async function resolveStoreLink(request, url, userAgent, storePattern) {
  const first = await checkLink(request, url, userAgent);
  if (storePattern.test(first.finalUrl)) return { storeUrl: first.finalUrl, status: first.status, via: 'redirect' };

  const res = await request.get(url, { headers: { 'user-agent': userAgent }, maxRedirects: 10 });
  const found = (await res.text()).match(new RegExp(`${storePattern.source.replace(/^\^/, '')}[^"'\\s<>]*`));
  if (!found) return { storeUrl: null, status: res.status(), via: 'none' };

  const storeUrl = found[0].replace(/&amp;/g, '&');
  const check = await checkLink(request, storeUrl, userAgent);
  return { storeUrl, status: check.status, via: 'landing-page' };
}

module.exports = { USER_AGENTS, checkLink, normaliseLinks, resolveStoreLink };
