const BasePage = require('./BasePage');
const { data, rx } = require('../support/testData');

/** About Us > Why MultiBank. On mb.io this is the "Company" page (h1 "Why MultiBank Group?"). */
class CompanyPage extends BasePage {
  constructor(page) {
    super(page, data.company.path);
    this.heading = page.getByRole('heading', { level: 1, name: rx(data.company.headingPattern) });
    this.intro = page.getByRole('heading', { name: rx(data.company.introPattern, 'i') });
    this.cta = page.getByRole('link', { name: 'Get in touch', exact: true });
  }

  async waitUntilReady() {
    await this.heading.waitFor({ state: 'visible' });
  }

  stat(value, label) {
    return this.block(value, label);
  }

  sectionHeading(name) {
    return this.page.getByRole('heading', { name, exact: true });
  }

  section(heading, body) {
    return this.block(heading, rx(body, 'i'));
  }

  strength(title, body) {
    return this.block(title, rx(body, 'i'));
  }
}

module.exports = CompanyPage;
