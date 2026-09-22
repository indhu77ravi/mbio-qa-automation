const BasePage = require('./BasePage');
const MoversWidget = require('./components/MoversWidget');
const { data, rx } = require('../support/testData');

class HomePage extends BasePage {
  constructor(page) {
    super(page, '/');
    this.downloadAppLink = page.getByRole('link', { name: rx(data.appDownload.linkNamePattern, 'i') }).first();
  }

  movers(heading) {
    return new MoversWidget(this.page, heading);
  }
}

module.exports = HomePage;
