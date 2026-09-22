/**
 * Loads the region profile from TestData/ (TARGET=ae|global, default ae).
 * global.json only lists what differs from ae.json; nav URLs are re-pointed to its locale.
 */
require('dotenv').config({ quiet: true });
const ae = require('../TestData/ae.json');
const global = require('../TestData/global.json');

function load() {
  const target = process.env.TARGET || 'ae';
  if (target === 'ae') return ae;
  if (target !== 'global') throw new Error(`Unknown TARGET "${target}". Valid: ae, global`);

  const toLocale = (s) => s.replace('/en-AE', global.localePath);
  return {
    ...ae,
    ...global,
    navigation: {
      ...ae.navigation,
      items: ae.navigation.items.map((i) => ({ ...i, urlPattern: toLocale(i.urlPattern) })),
    },
  };
}

const data = load();
if (process.env.BASE_URL) data.baseURL = process.env.BASE_URL;

/** Builds a RegExp from a "...Pattern" string in the test data. */
const rx = (pattern, flags = '') => new RegExp(pattern, flags);

/** '/explore' -> 'https://mb.io/en-AE/explore' */
const pageUrl = (path = '/') => `${data.baseURL}${data.localePath}${path === '/' ? '' : path}`;

module.exports = { data, rx, pageUrl };
