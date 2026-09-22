@regression @trading
Feature: Spot market categories
  Trading pairs are grouped into Hot, Gainers and Losers

  Background:
    Given I am on the explore page
    And the spot market has loaded

  Scenario: Hot shows valid entries
    When I select the "Hot" category
    Then the "Hot" category is active
    And the spot market shows at least 1 asset

  Scenario Outline: <category> only contains assets moving <direction>
    When I select the "<category>" category
    Then the "<category>" category is active
    And every asset shown is moving <direction>

    Examples:
      | category | direction |
      | Gainers  | up        |
      | Losers   | down      |

  Scenario: Categories filter the list
    When I view every category
    Then each category shows a different list

  Scenario: Gainers and Losers never share an asset
    When I view every category
    Then "Gainers" and "Losers" have no assets in common

  Scenario: Categories match the market data API
    Given I am recording market data traffic
    When I reload the explore page
    And I view every category
    Then each category only shows assets the API assigns to it
