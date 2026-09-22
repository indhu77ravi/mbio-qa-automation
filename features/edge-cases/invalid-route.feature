@regression @edge-case
Feature: Invalid route handling
  Visitors who follow a bad link get a clear not-found page and a way back

  Scenario: Unknown URL shows a 404 page
    When I open a page that does not exist
    Then the server responds with status 404
    And I see the "Page not found" message
    And the main navigation is still available
    And no JavaScript errors occurred

  Scenario: Visitor can recover to the home page
    When I open a page that does not exist
    And I select "Back to Homepage"
    Then I am on a home page

  @known-bug
  Scenario: Recovery link keeps the visitor in their region
    # BUG-001: on /en-AE the 404 "Back to Homepage" link goes to /en (the non-UAE site).
    # Excluded from normal runs; `npm run test:known-bugs` runs it and it is EXPECTED to fail until fixed.
    Given known bug "BUG-001" is still open for this region
    When I open a page that does not exist
    Then the "Back to Homepage" link keeps the locale prefix

  Scenario: Malformed URL does not leak server internals
    When I open a malformed URL
    Then the server does not return a 5xx error
    And the page shows no stack trace or server error details
