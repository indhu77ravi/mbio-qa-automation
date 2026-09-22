/**
 * cucumber-js configuration. Choose a profile with -p, e.g. `npx cucumber-js -p smoke`.
 * Paths are not fixed here, so a single feature can be passed on the command line:
 *   npx cucumber-js features/navigation/top-navigation.feature
 *
 * Step timeout is set in support/hooks.js (cucumber.js has no "timeout" key).
 */
const common = {
  require: ['support/**/*.js', 'steps/**/*.js'],
  format: [
    'progress-bar',
    'allure-cucumberjs/reporter',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
    'junit:reports/junit.xml',
  ],
  formatOptions: {
    resultsDir: 'allure-results', // read by allure-cucumberjs v3 (top level, not nested)
    snippetInterface: 'async-await',
  },
  retry: process.env.CI ? 1 : 0,
};

module.exports = {
  // Everything except visual checks and documented known bugs
  default: { ...common, tags: 'not @visual and not @known-bug' },
  smoke: { ...common, tags: '@smoke and not @known-bug' },
  regression: { ...common, tags: '@regression and not @visual and not @known-bug' },
  mobile: { ...common, tags: '@mobile' },
  visual: { ...common, tags: '@visual', retry: 0 },
  // Expected to FAIL until the bugs are fixed; a pass means the bug is fixed
  knownBugs: { ...common, tags: '@known-bug', retry: 0 },
  // Faster local runs: several scenarios at once (each has its own browser)
  parallel: { ...common, tags: 'not @visual and not @known-bug', parallel: 3 },
};
