class Footer {
  constructor(page) {
    this.root = page.locator('footer').last();
  }

  link(label) {
    return this.root.getByRole('link', { name: label, exact: true });
  }

  async linkHrefs() {
    return this.root.getByRole('link').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  }
}

module.exports = Footer;
