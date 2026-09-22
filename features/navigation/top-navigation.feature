@smoke @navigation
#Top navigation renders with all expected items visible 
#Each navigation item links to the correct destination
 
Feature: Top navigation
  As a visitor
  I want a consistent main navigation
  So that I can reach every area of mb.io

  Background:
    Given I am on the home page

  Scenario: Main navigation shows every expected item
    Then I see the site logo
    And the main navigation shows these items:
      | Explore  |
      | Features |
      | OTC Desk |
      | Company  |
      | Support  |
      | Blog     |
      | $MBG     |

  Scenario: Internal navigation links keep the visitor's region
    Then every internal navigation link keeps the locale prefix

  Scenario: Account links point to the trading app
    # Checked by href only: the brief forbids creating accounts
    Then the "Sign in" link points to the trading app login
    And the "Sign up" link points to the trading app registration

  Scenario Outline: "<item>" opens the correct page
    When I select "<item>" in the main navigation
    Then I land on the "<item>" destination

    Examples:
      | item     |
      | Explore  |
      | Features |
      | OTC Desk |
      | Company  |
      | Support  |
      | Blog     |
      | $MBG     |
