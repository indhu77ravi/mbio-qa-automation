const fs = require('fs');
const path = require('path');
const { Before, After, BeforeStep, AfterStep, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const { launchBrowser, closeBrowser } = require('./browser');
const PageObjectManager = require('../pages/PageObjectManager');
const { addLabels, addSeverity } = require('../steps/allurelogger');

// Default for every step. cucumber.js has no "timeout" config key, so it is set here.
// Individual steps can still override: Then('...', { timeout: 120_000 }, async function () {})
setDefaultTimeout(60_000);

const TRACE_DIR = path.join(__dirname, '../reports/traces');
const stepScreenshots = process.env.STEP_SCREENSHOTS !== 'false';

/** Named attachment (cucumber-js v12 takes the name via { mediaType, fileName }). */
function attach(world, body, mediaType, name) {
  world.attach(body, { mediaType, fileName: name });
}

Before(async function ({ pickle, gherkinDocument }) {
  const tags = pickle.tags.map((t) => t.name);
  this.isVisualScenario = tags.includes('@visual');

  const { browser, context, page, consoleLogs, pageErrors, label } = await launchBrowser({
    isMobile: tags.includes('@mobile'),
  });
  Object.assign(this, { browser, context, page, consoleLogs, pageErrors });
  this.poManager = new PageObjectManager(page);

  // Allure grouping: epic = feature folder, feature = Feature name; @smoke = critical
  const folder = path.basename(path.dirname(gherkinDocument.uri));
  await addLabels(folder, gherkinDocument.feature?.name, undefined);
  await addSeverity(tags.includes('@smoke') ? 'critical' : 'normal');
  attach(this, `Browser: ${label} | Region: ${this.data.name} (${this.data.localePath})`, 'text/plain', 'Run info');
});

BeforeStep(function ({ pickleStep }) {
  console.log(`\n[${new Date().toISOString()}] Executing Step: ${pickleStep.text}`);
  this.stepStartTime = Date.now();
});

AfterStep(async function ({ pickleStep, result }) {
  const duration = this.stepStartTime ? Date.now() - this.stepStartTime : 0;
  try {
    // Screenshot after every step, passed or failed (disable with STEP_SCREENSHOTS=false)
    if (this.page && !this.isVisualScenario && (stepScreenshots || result.status === Status.FAILED)) {
      const target = this.activePage.isClosed() ? this.page : this.activePage;
      const screenshot = await target.screenshot({ type: 'png', fullPage: false });
      const label = { PASSED: '✓ PASSED', FAILED: '✗ FAILED', SKIPPED: '○ SKIPPED' }[result.status] || result.status;
      attach(this, screenshot, 'image/png', `Step ${label}: ${pickleStep.text.slice(0, 60)}`);
      console.log(`Step ${label} (${duration}ms): ${pickleStep.text}`);
    }
  } catch (error) {
    console.log('Error in AfterStep hook:', error.message);
  }
});

After(async function ({ pickle, result }) {
  const failed = result?.status === Status.FAILED;
  try {
    if (this.page && !this.page.isClosed() && !this.isVisualScenario) {
      const shot = await this.page.screenshot({ fullPage: true, type: 'png' });
      attach(this, shot, 'image/png', failed ? 'Failed Screenshot' : 'Final Screenshot (Passed)');
      const info = { url: this.page.url(), title: await this.page.title(), status: result?.status };
      attach(this, JSON.stringify(info, null, 2), 'application/json', 'Page Information');
    }
    if (this.consoleLogs.length) attach(this, this.consoleLogs.join('\n'), 'text/plain', 'Browser Console Logs');

    if (this.context) {
      if (failed) {
        fs.mkdirSync(TRACE_DIR, { recursive: true });
        const tracePath = path.join(TRACE_DIR, `${pickle.name.replace(/[^\w-]+/g, '_').slice(0, 80)}.zip`);
        await this.context.tracing.stop({ path: tracePath });
        const note = `Trace saved: ${tracePath}\nOpen with: npx playwright show-trace "${tracePath}"`;
        attach(this, note, 'text/plain', 'Playwright Trace');
      } else {
        await this.context.tracing.stop();
      }
    }
  } catch (error) {
    console.log('Error in After hook:', error.message);
  } finally {
    await closeBrowser(this.browser);
    this.browser = this.context = this.page = null;
  }
});
