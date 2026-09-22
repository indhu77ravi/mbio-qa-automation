/**
 * Pure helpers (no browser): parsing market data text and building matchers.
 * Unit-tested in tests/unit/utils.test.js.
 */
class utils {
  /** "$1,234.56" | "0.00001234 USDT" | "43,000.12 ≈ $43,000" -> first number. NaN if none. */
  static parsePrice(text) {
    const match = String(text).match(/\d[\d,]*(?:\.\d+)?|\.\d+/);
    return match ? Number(match[0].replace(/,/g, '')) : NaN;
  }

  /** "+2.35%" | "-0.8 %" | "−2.35%" (unicode minus) -> number. NaN if none. */
  static parsePercent(text) {
    const match = String(text).match(/([+\-\u2212]?)\s*(\d+(?:\.\d+)?)\s*%/);
    if (!match) return NaN;
    return (match[1] === '-' || match[1] === '\u2212' ? -1 : 1) * Number(match[2]);
  }

  /** Escapes text for literal use in a RegExp. */
  static escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Case-insensitive literal matcher, for text coming from a feature file. */
  static literal(text) {
    return new RegExp(utils.escapeRegExp(text), 'i');
  }
}

/** Ticker symbols as used in URLs and the API: BTC, ETH, 1INCH, MBG. */
utils.SYMBOL = /^[A-Z0-9]{2,10}$/;

/** Text that indicates a rendering bug rather than real data. */
utils.BROKEN_VALUE = /\b(NaN|undefined|null|Infinity)\b|\{\{.*\}\}|\[object Object\]/;

module.exports = { utils };
