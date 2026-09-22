/**
 * Allure logging helpers (same function names as the reference framework).
 * Uses the allure-cucumberjs v3 runtime API from allure-js-commons, so calls
 * actually reach the report. Every helper also logs to the console.
 */
const allure = require('allure-js-commons');

/** Attach a data object as JSON. */
async function logTestData(name, data) {
  console.log(`${name}:`, JSON.stringify(data, null, 2));
  await allure.attachment(name, JSON.stringify(data, null, 2), 'application/json').catch(() => undefined);
}

/** Run `fn` as a named sub-step in the Allure report. */
async function logStep(name, fn) {
  console.log(`\n🔹 ${name}`);
  return allure.step(name, fn);
}

/** Attach plain text. */
async function logInfo(name, content) {
  console.log(`${name}: ${content}`);
  await allure.attachment(name, String(content), 'text/plain').catch(() => undefined);
}

async function addDescription(description) {
  await allure.description(description).catch(() => undefined);
}

/** @param {'blocker'|'critical'|'normal'|'minor'|'trivial'} severity */
async function addSeverity(severity) {
  await allure.severity(severity).catch(() => undefined);
}

async function addLabels(epic, feature, story) {
  if (epic) await allure.epic(epic).catch(() => undefined);
  if (feature) await allure.feature(feature).catch(() => undefined);
  if (story) await allure.story(story).catch(() => undefined);
}

module.exports = { logTestData, logStep, logInfo, addDescription, addSeverity, addLabels };
