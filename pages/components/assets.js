const { data } = require('../../support/testData');

/**
 * Reads market entries (table rows or widget links) in ONE evaluate() call: prices
 * tick continuously, so reading cell by cell could mix values from different renders.
 * Direction comes from the arrow icon, because the UI shows percentages unsigned.
 *
 * @returns {Promise<Array<{symbol:string, text:string, href:string|null, direction:'up'|'down'|null, conflictingIndicators:boolean}>>}
 */
async function readEntries(items) {
  const raw = await items.evaluateAll(
    (els, sel) =>
      els.map((el) => {
        const link = el.matches('a') ? el : el.querySelector('a[href*="explore/"]');
        return {
          text: el.innerText.replace(/\s+/g, ' ').trim(),
          href: link ? link.getAttribute('href') : null,
          up: !!el.querySelector(sel.up),
          down: !!el.querySelector(sel.down),
        };
      }),
    { up: data.ui.upIndicator, down: data.ui.downIndicator },
  );
  return raw.map((r) => ({
    symbol: (r.href || '').split('/').filter(Boolean).pop()?.toUpperCase() || '',
    text: r.text,
    href: r.href,
    direction: r.up && !r.down ? 'up' : r.down && !r.up ? 'down' : null,
    conflictingIndicators: r.up && r.down,
  }));
}

module.exports = { readEntries };
