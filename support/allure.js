/**
 * Registers the Allure runtime with Cucumber so the allure-js-commons API
 * (used by steps/allurelogger.js) writes into the report.
 * Note: allure-cucumberjs v3 has no `allure` export; the API lives in allure-js-commons.
 */
require('allure-cucumberjs');
