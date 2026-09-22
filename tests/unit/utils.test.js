// Unit tests for pure helpers (no browser). Run: npm run unit
const test = require('node:test');
const assert = require('node:assert/strict');
const { utils } = require('../../steps/utils');
const { SoftAssert } = require('../../steps/softAssert');
const { normaliseLinks } = require('../../steps/linkUtils');

test('parsePrice handles currency symbols, separators and trailing text', () => {
  assert.equal(utils.parsePrice('$1,234.56'), 1234.56);
  assert.equal(utils.parsePrice('0.00001234 USDT'), 0.00001234);
  assert.equal(utils.parsePrice('43,000.12 ≈ $43,000.12'), 43000.12);
  assert.ok(Number.isNaN(utils.parsePrice('--')));
});

test('parsePercent handles signs, unicode minus and spacing', () => {
  assert.equal(utils.parsePercent('+2.35%'), 2.35);
  assert.equal(utils.parsePercent('-0.8 %'), -0.8);
  assert.equal(utils.parsePercent('\u22122.5%'), -2.5);
  assert.equal(utils.parsePercent('6.51%'), 6.51);
  assert.ok(Number.isNaN(utils.parsePercent('n/a')));
});

test('SYMBOL and BROKEN_VALUE patterns', () => {
  for (const s of ['BTC', 'ETH', '1INCH', 'MBG']) assert.match(s, utils.SYMBOL);
  assert.doesNotMatch('Bitcoin', utils.SYMBOL);
  for (const bad of ['NaN', '$undefined', 'null %', '{{price}}', '[object Object]']) assert.match(bad, utils.BROKEN_VALUE);
  assert.doesNotMatch('$85,850.40', utils.BROKEN_VALUE);
});

test('literal() matches text containing regex characters', () => {
  assert.match('Price: $2 trillion (approx.)', utils.literal('$2 trillion (approx.)'));
});

test('SoftAssert collects every failure and reports them together', async () => {
  const soft = new SoftAssert();
  await soft.check('first', () => assert.equal(1, 2));
  await soft.check('passes', () => assert.equal(1, 1));
  await soft.check('second', () => assert.equal('a', 'b'));
  assert.equal(soft.failures.length, 2);
  assert.throws(() => soft.assertAll('Demo'), /Demo: 2 check\(s\) failed/);
});

test('normaliseLinks keeps http(s) only, strips fragments, de-duplicates', () => {
  const out = normaliseLinks(['/a#top', '/a', 'mailto:x@y.z', 'https://x.com/b', null, '#'], 'https://mb.io/en-AE');
  assert.deepEqual(out, ['https://mb.io/a', 'https://x.com/b']);
});
