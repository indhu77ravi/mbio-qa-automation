@regression @content
Feature: About Us > Why MultiBank
  On mb.io, About Us is the "Company" page, headed "Why MultiBank Group?"

  Scenario: Page is reachable from the navigation
    Given I am on the home page
    When I select "Company" in the main navigation
    Then I see the "Why MultiBank Group?" page

  Scenario: Heading and introduction
    Given I am on the Why MultiBank page
    Then the page has a single main heading "Why MultiBank Group?"
    And the introduction is visible

  Scenario: Key figures
    Given I am on the Why MultiBank page
    Then these key figures are shown:
      | value       | label               |
      | $2 trillion | Annual turnover     |
      | 2,000,000+  | Customers worldwide |
      | 25+         | Offices globally    |

  Scenario Outline: "<section>" section
    Given I am on the Why MultiBank page
    Then the "<section>" section is shown with its text

    Examples:
      | section                             |
      | A tradition of global leadership    |
      | Innovation with purpose             |
      | Integrity built into every decision |

  Scenario: Strength cards
    Given I am on the Why MultiBank page
    Then these strength cards are shown:
      | Regulation at our core |
      | Proven track record    |
      | Secure & trusted       |

  Scenario: Contact call-to-action
    Given I am on the Why MultiBank page
    Then the "Get in touch" link points to the contact page

  Scenario: Images load
    Given I am on the Why MultiBank page
    When I scroll through the whole page
    Then no image on the page is broken
