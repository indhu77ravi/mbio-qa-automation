# mb.io QA Automation — Playwright + Cucumber.js + Allure

BDD UI automation for **[mb.io/en-AE](https://mb.io/en-AE)**, the UAE site of MultiBank Group's
crypto platform. Scenarios are written in Gherkin, run by **cucumber-js**, drive the browser with
**Playwright**, and are reported in **Allure**.

```bash
npm run setup
npm run test:run-and-open
```

`setup` installs dependencies and browsers (first run only). `test:run-and-open` runs every
scenario in a visible Chromium window, then builds and opens the Allure report. The Allure
report needs Java; without it, open `reports/cucumber-report.html` instead.

> **Run it from the UAE** (or through a UAE proxy, see [Region handling](#region-handling)).
> mb.io redirects `/en-AE` to `/en` for visitors elsewhere; the suite stops with a clear
> message if that happens.

---

## Project structure

```
├── features/                    Gherkin scenarios, grouped by area
│   ├── navigation/  trading/  content/  edge-cases/  api/  visual/
├── steps/                       step definitions + helpers
│   ├── common.steps.js          open pages, network recording, page health
│   ├── navigation.steps.js  trading.steps.js  content.steps.js  edgeCases.steps.js
│   ├── visualRegression/visual.steps.js
│   ├── utils.js                 pure parsing helpers (unit tested)
│   ├── playwrightUtils.js       browser helpers (new window, layout, images)
│   ├── linkUtils.js             HTTP link checks, smart-link resolution
│   ├── softAssert.js            collect every failure in a step
│   └── allurelogger.js          logStep / logTestData / logInfo / labels
├── pages/                       Page Object Model
│   ├── PageObjectManager.js     this.poManager.homePage / explorePage / companyPage
│   ├── BasePage.js  HomePage.js  ExplorePage.js  CompanyPage.js
│   ├── components/              Header, Footer, MarketTable, MoversWidget
│   └── visualRegression/        component map for visual checks
├── support/
│   ├── world.js                 per-scenario World (this.page, this.poManager, this.ctx, this.data)
│   ├── hooks.js                 launch/close browser, screenshots, trace, console logs, Allure labels
│   ├── browser.js               BROWSER / HEADLESS / SLOWMO / mobile devices / proxy
│   ├── allure.js                registers the Allure runtime
│   ├── visualComparison.js      baseline / compare with pixelmatch
│   └── testData.js              loads the region profile
├── TestData/                    ae.json (default), global.json, visual baselines
├── tests/unit/                  unit tests for helpers (node --test)
├── scripts/                     run-and-report, cross-browser, discover
├── cucumber.js                  profiles: default, smoke, regression, mobile, visual, knownBugs, parallel
└── .env.example                 copy to .env to set options
```

## Running

| Command | What it does |
|---|---|
| `npm test` | All scenarios (except `@visual` and `@known-bug`) in a visible Chromium |
| `npx cucumber-js features/navigation/top-navigation.feature` | One feature file |
| `npx cucumber-js features/trading/` | One folder |
| `npx cucumber-js --name "Gainers and Losers"` | Scenarios whose name matches |
| `npx cucumber-js --tags "@compliance"` | By tag (combined with the default profile's filter) |
| `npm run test:smoke` / `test:regression` / `test:mobile` | Profiles from `cucumber.js` |
| `npm run test:chrome` / `test:firefox` / `test:webkit` | Pick the browser |
| `npm run test:cross-browser` | Chromium, Firefox, WebKit one after another; reports in `reports-<browser>/` |
| `npm run test:parallel` | 3 scenarios at a time |
| `npm run test:headless` | No browser window |
| `npm run test:global` | Same features against the non-UAE site |
| `npm run test:known-bugs` | Documented bugs; **expected to fail** until fixed |
| `npm run visual:baseline` → `npm run visual:compare` | Visual regression (before → after a deployment) |
| `npm run steps:dry-run` | Checks every step is defined, without opening a browser |
| `npm run unit` | Unit tests for the helpers |

**Options** (set in `.env`, or inline, e.g. PowerShell `$env:BROWSER="chrome"; npm test`):

| Variable | Values | Default |
|---|---|---|
| `BROWSER` | `chromium`, `chrome` (installed Google Chrome), `firefox`, `webkit` | `chromium` |
| `HEADLESS` | `true` / `false` | `false` locally, `true` in CI |
| `SLOWMO` | ms between actions, to watch a run | `0` |
| `STEP_SCREENSHOTS` | screenshot after every step | `true` |
| `MOBILE_DEVICE` | device for `@mobile` scenarios | `Pixel 7` |
| `TARGET` | `ae`, `global` | `ae` |
| `PROXY_SERVER` | regional proxy URL | none |

To watch one feature slowly in Chrome (PowerShell):

```powershell
$env:BROWSER="chrome"; $env:SLOWMO="800"; npx cucumber-js features/navigation/top-navigation.feature
```

## Reports

| Report | Where | For |
|---|---|---|
| **Allure** | `allure-report/` (`npm run allure:generate`, `npm run allure:open`) | Main report: steps, a screenshot per step, page info, console logs, data attachments, grouped by epic (folder) and feature, `@smoke` marked critical |
| Cucumber HTML | `reports/cucumber-report.html` | Quick view without Java |
| Cucumber JSON | `reports/cucumber-report.json` | Jira/Xray and other tools |
| JUnit XML | `reports/junit.xml` | CI test summaries |
| Playwright trace | `reports/traces/*.zip` (failed scenarios only) | Replay a failure action by action: `npx playwright show-trace <file>` |

`npm run test:report` and `test:run-and-open` always generate Allure, **even when scenarios
fail**, and still exit with the test result so CI fails correctly.

## Coverage

| Brief requirement | Feature file |
|---|---|
| Nav renders, links correctly, desktop sizes | `navigation/top-navigation.feature`, `navigation/desktop-viewports.feature` |
| Spot pairs, categories, entry fields | `trading/spot-market.feature`, `trading/categories.feature` (+ `home-movers.feature`) |
| Banners, app store links, Why MultiBank | `content/banners.feature`, `content/app-download.feature`, `content/why-multibank.feature` |
| Invalid route, broken links, mobile, loading timeout | `edge-cases/*.feature` (all four; the brief asks for two) |
| Bonus: API, visual, data-driven, CI | `api/market-data.feature`, `visual/visual.feature`, `TestData/`, `.github/workflows/e2e.yml` |
| Extra: regulatory compliance | `content/regulatory-footer.feature` |

60 scenarios in 15 feature files.

## Findings from building the suite

Observed on the live site on 22 Sep 2026. Items 1–3 shaped the design; 4–9 are defects
or risks I'd raise with the team.

1. **Target moved.** `trade.multibank.io` redirects to `trade.mb.io` (the login-gated
   trading app). The public site with the brief's scenarios is `mb.io/en-AE`.
2. **Region-specific content by IP.** `/en-AE` is served in the UAE; elsewhere it redirects to
   `/en`. The UAE footer links GCC/VARA documents (e.g. _VA Standards_, _Public Disclosure_)
   that the global site doesn't have.
3. **No App Store / Google Play badges.** One smart link (`mbio.go.link`) routes by device.
4. **Bug: 404 recovery link drops the locale.** On `/en-AE/...` the "Back to Homepage" link
   goes to `/en`, moving UAE users to the non-UAE site and its different regulatory content.
   Covered by a `@known-bug` scenario (`npm run test:known-bugs`), expected to fail until fixed.
5. **Accessibility: price direction is shown only by the arrow icon.** Percentages are
   unsigned ("6.51%") and the arrow has no text alternative, so a screen reader announces
   a 6.51 % loss as "6.51%" (WCAG 1.1.1 / 1.4.1). The suite reads direction from the icon's
   class for this reason.
6. **Accessibility: category buttons expose no selected state** (`aria-pressed`/`aria-selected`);
   the active one is only styled. The suite checks ARIA first and falls back to the class.
7. **Accessibility: the market table has no header row**, so columns have no names for
   assistive tech. The suite reads columns by position.
8. **Sub-cent assets show as `$0.00`** (e.g. SHIB), so the price is uninformative.
9. **Asset links omit the locale** (`/explore/BTC` rather than `/en-AE/explore/BTC`) and rely on
   a redirect; worth confirming region is preserved for every entry point.

## Design decisions

**Three layers.** Features say *what* is expected, step definitions translate each sentence,
page objects know *how* to find things. A redesign changes page objects only; a new business rule
changes features only. Steps reach pages through `this.poManager`, created fresh per scenario.

**A fresh browser per scenario** (Before/After hooks), so scenarios are independent and can run
in parallel (`npm run test:parallel`).

**Resilient locators.** Role + accessible name, scoped to landmarks (`<nav aria-label="Main">`,
`<footer>`), instead of XPath tied to layout or generated CSS classes. The two class-based selectors
(price arrow, active category) exist only because the site has no accessible alternative
(findings 5–6), and they live in `TestData/ae.json`.

**Assertions on rules, not live values.** Prices tick constantly, so steps check formats,
direction per category, disjoint lists, and agreement with the API within a tolerance. Rows are
read in one `evaluate()` so a re-render can't mix values from two moments.

**Soft assertions that work under cucumber-js.** Playwright's `expect.soft` only works inside the
Playwright test runner; under cucumber-js it stops at the first failure. `SoftAssert` collects
every failure in a step, so one run lists all bad rows.

**UI ↔ API cross-checks.** The category and price APIs the page calls are recorded and used as
oracles: the UI must show what the API returns.

**Region profiles in JSON.** Nav URLs, regulatory documents, API URLs and copy live in
`TestData/ae.json`; `TARGET=global` runs the same features against the non-UAE site.

**Determinism.** No fixed sleeps in functional steps (waits are on conditions); analytics and
Cookiebot are blocked; a scoped handler clicks **Deny** if a consent banner still appears.

**Evidence.** A screenshot after every step, a full-page screenshot and page info at the end,
browser console logs, and a Playwright trace for failed scenarios, all attached to the report.

## Region handling

The site picks content by IP, so where tests run matters:

| Where you run                      | Command                                           |
| ---------------------------------- | ------------------------------------------------- |
| In the UAE                         | `npm test`                                        |
| Elsewhere, testing the UAE site    | `set `PROXY_SERVER=http://<uae-proxy>:<port>` in `.env`, then `npm test`` |
| Elsewhere, testing the global site | `npm run test:global`                             |

In CI, set the repo secret `UAE_PROXY_SERVER`; GitHub-hosted runners are outside the UAE.

## Differences from the reference framework

This project follows the reference framework's structure and conventions (cucumber-js, Playwright
library, `support/hooks.js` + `browser.js`, `PageObjectManager`, `steps/allurelogger.js`,
`playwrightUtils`, `TestData/`, baseline/compare visual mode, `cucumberautocomplete`). A few things
are deliberately different, because they don't behave as intended in the current library versions:

| Topic | Reference | Here | Why |
|---|---|---|---|
| Allure API | `require('allure-cucumberjs').allure` | `allure-js-commons` | v3 has no `allure` export, so the reference's `logStep`/`logTestData` only reach the console |
| Step timeout | `timeout` in `cucumber.js` | `setDefaultTimeout` in hooks | `timeout` isn't a cucumber.js option; the real default stays 5 s |
| Attachment names | 3rd argument to `attach` | `{ mediaType, fileName }` | cucumber-js v12 ignores a 3rd argument |
| Report after failures | `npm run test && allure generate` | `scripts/run-and-report.js` | `&&` skips the report when a test fails |
| Soft checks | log a warning and continue | `SoftAssert`, fails at the end of the step | warnings can hide real failures |
| Traces | `trace` option on `newContext` | `context.tracing` start/stop | `newContext` has no trace/video/screenshot options |
| Browsers | Chromium only | `BROWSER`, mobile devices via `@mobile` | the brief asks for cross-browser evidence |
| Secrets | `.env` committed | `.env.example` committed, `.env` git-ignored | credentials must not be in the repo |

## Adding a scenario

1. Write it in a `.feature` file. With the **Cucumber (Gherkin) Full Support** extension
   (`alexkrechik.cucumberautocomplete`), existing steps autocomplete as you type.
2. Run `npm run steps:dry-run`. Undefined steps are listed with a ready-to-paste snippet.
3. Add the step to the matching `steps/*.steps.js`, using `function () {}` and `this.poManager`.
4. Run it: `npx cucumber-js features/<area>/<file>.feature`.

## Assumptions and limitations

- No login, no forms submitted, no personal data (per the brief). Sign in / Sign up are checked by href only.
- The smart download link's per-device behaviour was designed from how such links generally work.
- Asset detail pages are checked for URL, non-404 and symbol presence only.
- Next steps: axe-core accessibility checks (would formalise findings 5–7), performance budgets,
  Allure history across CI runs.
