@regression @trading
Feature: Home page market movers
  The home page highlights the day's biggest movers

  Background:
    Given I am on the home page

  Scenario Outline: "<widget>" lists assets <rule>
    When I scroll to the "<widget>" widget
    Then the "<widget>" widget lists at least 3 assets with a price and change
    And every asset in "<widget>" is moving <direction>

    Examples:
      | widget      | rule        | direction |
      | Top Gainers | moving up   | up        |
      | Top Losers  | moving down | down      |

  Scenario: "Trending Now" lists assets
    When I scroll to the "Trending Now" widget
    Then the "Trending Now" widget lists at least 3 assets with a price and change
