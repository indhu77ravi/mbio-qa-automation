@smoke @trading
Feature: Spot market
  As a trader
  I want to see live spot prices
  So that I can decide what to trade

  # Prices are live: scenarios assert formats and rules, never exact values.
  # The UI shows % change unsigned; direction is carried by the arrow icon.

  Background:
    Given I am on the explore page
    And the spot market has loaded

  Scenario: Spot market lists trading pairs
    Then the spot market shows at least 10 assets

  Scenario: Every entry contains the expected data fields
    Then every spot market entry has a symbol and a name
    And every spot market entry has a USD price
    And every spot market entry has a 24h change with a direction arrow
    And every spot market entry links to its detail page
    And no spot market entry shows a broken value

  Scenario: Each asset is listed once
    Then no asset appears twice in the spot market

  Scenario: Selecting an asset opens its detail page
    When I select the first asset in the spot market
    Then I am on that asset's detail page
