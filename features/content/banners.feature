@regression @content
Feature: Marketing banners
  Promotional banners on the explore page sit between the heading and the market data

  Background:
    Given I am on the explore page

  Scenario: Every banner is visible
    Then these banners are visible:
      | Earn interest on your assets         |
      | Get crypto with your card            |
      | Deposits using card or wire transfer |

  Scenario: Banners render in the expected page region
    Then every banner is below the page heading and above the spot market

  Scenario: Banner call-to-actions point to the trading app
    Then every banner call-to-action points to the trading app

  Scenario: Banner images load
    Then no banner has a broken image
