@smoke @compliance
Feature: Regulatory footer
  A regulated entity must publish the documents its jurisdiction requires.
  The required list comes from the active region profile (UAE: GCC/VARA documents).

  Background:
    Given I am on the home page

  Scenario: Footer links every required document
    Then the footer links every regulatory document required in this region

  Scenario: Every required document is reachable
    Then every required regulatory document responds successfully
