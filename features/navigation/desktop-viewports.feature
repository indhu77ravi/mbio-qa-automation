@regression @navigation
Feature: Navigation layout at desktop sizes
  The full navigation must stay usable on common desktop screens

  Scenario Outline: Full navigation is usable at <width>x<height>
    Given my screen is <width> by <height> pixels
    And I am on the home page
    Then the menu button is hidden
    And every navigation item is inside the viewport
    And no navigation items overlap
    And the page does not scroll horizontally

    Examples:
      | width | height |
      | 1280  | 720    |
      | 1440  | 900    |
      | 1920  | 1080   |
