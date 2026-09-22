@smoke @content
Feature: App download
  mb.io has one "Download the app" smart link that routes each device to its store

  Scenario: Download link is present
    Given I am on the home page
    Then the "Download the app" link is visible and points to the smart link

  Scenario Outline: Smart link resolves to <store> for <device> users
    Given I am on the home page
    When I follow the download link as a <device> user
    Then I reach the "<store>" listing

    Examples:
      | device  | store       |
      | iPhone  | App Store   |
      | Android | Google Play |
