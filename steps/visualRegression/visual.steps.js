/**
 * Visual regression steps (baseline/compare, like the reference framework).
 *   npm run visual:baseline  -> save baselines (before a deployment)
 *   npm run visual:compare   -> compare against them (after a deployment)
 */
const { When, Then } = require('@cucumber/cucumber');
const { captureAndCompare, isBaselineMode } = require('../../support/visualComparison');
const { getComponent } = require('../../pages/visualRegression/visualComponents');
const { logStep } = require('../allurelogger');

When('I capture the {string} component', { timeout: 120_000 }, async function (name) {
  const component = getComponent(name);
  const pageObject = this.poManager.byName(component.page);
  await pageObject.open();
  if (component.page === 'explore') await pageObject.table.waitForData(1);

  const mode = isBaselineMode ? 'BASELINE' : 'COMPARE';
  this.ctx.visualResult = await logStep(`Visual [${mode}]: ${name}`, () =>
    captureAndCompare(this.page, name, {
      locator: component.locate(this.page),
      mask: component.mask ? component.mask(this.page) : [],
      fullPage: !!component.fullPage,
      attach: this.attach.bind(this),
    }),
  );
});

Then('it matches the visual baseline', async function () {
  const result = this.ctx.visualResult;
  if (result.mode === 'baseline') return; // nothing to compare when capturing
  if (!result.passed) throw new Error(`Visual regression failed: ${result.message}`);
});
