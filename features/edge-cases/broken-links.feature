@regression @edge-case @slow
Feature: Broken link detection

  Scenario: Header and footer links all resolve
    Given I am on the home page
    When I check every header and footer link
    Then no link is broken
