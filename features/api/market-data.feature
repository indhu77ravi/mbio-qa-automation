@regression @api
Feature: Market data API
  The UI is only as good as the data behind it

  Background:
    Given I am recording market data traffic
    And I am on the explore page
    And the spot market has loaded

  Scenario: No first-party API call fails
    Then no first-party API call failed

  Scenario: Price feed is healthy
    Then the price feed returns JSON quotes
    And every quote is internally consistent
    And every quote is less than 24 hours old

  Scenario: UI prices match the price feed
    Then spot market prices are within 2% of the price feed
