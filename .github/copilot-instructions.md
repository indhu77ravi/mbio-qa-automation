# Copilot instructions for mbio-qa-automation

## Project overview
Playwright + Cucumber.js (JavaScript, CommonJS) BDD framework with Allure reporting for https://mb.io/en-AE.
Scenarios are Gherkin; the browser is launched per scenario in `support/hooks.js`.

## Key folders
- `features/` Gherkin feature files, grouped by area (navigation, trading, content, edge-cases, api, visual)
- `steps/` step definitions plus helpers: `utils.js` (pure parsing), `playwrightUtils.js` (browser helpers),
  `linkUtils.js` (HTTP link checks), `softAssert.js`, `allurelogger.js`
- `pages/` Page Object Model; `PageObjectManager.js` exposes them as `this.poManager.homePage` etc.
- `support/` World, hooks, browser launch, Allure registration, visual comparison, test-data loader
- `TestData/` region profiles (`ae.json`, `global.json`) and visual baselines

## Conventions
- Step definitions use `function () {}` (never arrow functions) so `this` is the Cucumber World.
- Use `this.poManager.<page>` for UI access; never put raw selectors in steps.
- Locators: `getByRole` / accessible names first. Avoid positional XPath such as `//main/div[3]`.
- Assert rules and formats, not live prices: market data changes every second.
- When checking lists, use `SoftAssert` so every failure is reported (expect.soft does not work under cucumber-js).
- Region-specific values (URLs, regulatory documents, API URLs) belong in `TestData/*.json`, not in steps.
  Keys ending in `Pattern` are regular expressions; build them with `rx()` from `support/testData.js`.
- Share state between steps through `this.ctx` (reset per scenario), never module-level variables.
- Log useful data to Allure with `logTestData`, `logInfo`, `logStep` from `steps/allurelogger.js`.
- Tags: `@smoke`, `@regression`, `@mobile` (runs on an emulated phone), `@visual`, `@known-bug`.

## Workflows
- All scenarios: `npm test` · one feature: `npx cucumber-js features/<area>/<name>.feature`
- Browser: `BROWSER=chrome|chromium|firefox|webkit`; watch slowly: `SLOWMO=800`
- Allure: `npm run test:run-and-open` (needs Java)
- Visual: `npm run visual:baseline` before a deployment, `npm run visual:compare` after
- Check all steps are defined: `npm run steps:dry-run`
