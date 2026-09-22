/**
 * Component map for visual regression (same idea as the reference's homePage.page.js):
 * name used in the feature file -> how to find it, which page it's on, what to mask.
 * Role-based locators instead of positional XPath (e.g. //main/div[3]), which breaks on any layout change.
 */
const COMPONENTS = {
  header: { page: 'home', locate: (p) => p.locator('header').first() },
  'explore-above-fold': {
    page: 'explore',
    locate: () => null, // null = viewport screenshot
    mask: (p) => [p.getByRole('table'), p.getByText(/Extreme|Fear|Greed|Neutral/)],
  },
  'company-page': { page: 'company', locate: () => null, fullPage: true },
};

function getComponent(name) {
  const component = COMPONENTS[name];
  if (!component) {
    throw new Error(`Unknown visual component "${name}". Available: ${Object.keys(COMPONENTS).join(', ')}`);
  }
  return component;
}

module.exports = { getComponent };
