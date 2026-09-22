@regression @edge-case
Feature: Content loading failures
  Market data outages must degrade gracefully, never show garbage prices

  Scenario: Market data times out
    Given the market data API times out
    When I open the explore page
    Then the page heading and navigation still work
    And no broken values are shown
    And no JavaScript errors occurred

  @slow
  Scenario: Market data is slow
    Given the market data API responds after 5 seconds
    When I open the explore page
    Then the spot market eventually lists at least 10 assets
    And no broken values are shown
