@mobile @regression @edge-case
Feature: Mobile breakpoint
  Runs on an emulated phone (MOBILE_DEVICE, default Pixel 7; e.g. "iPhone 14" uses WebKit)

  Scenario: Home page fits the screen
    Given I am on the home page
    Then the page does not scroll horizontally

  Scenario: Navigation collapses into a menu
    Given I am on the home page
    Then the main navigation is collapsed
    When I open the menu
    Then the menu shows these items:
      | Explore  |
      | Features |
      | OTC Desk |
      | Company  |
      | Support  |
      | Blog     |
      | $MBG     |

  Scenario: Spot market is readable on a phone
    Given I am on the explore page
    And the spot market has loaded
    Then the first spot market entry is on screen
    And the page does not scroll horizontally
