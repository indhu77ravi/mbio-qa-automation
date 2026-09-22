@visual
Feature: Visual regression
  Before a deployment: "npm run visual:baseline" captures baselines.
  After a deployment: "npm run visual:compare" compares against them.
  Live market data is masked so price ticks never cause a difference.

  Scenario Outline: "<component>" matches its baseline
    When I capture the "<component>" component
    Then it matches the visual baseline

    Examples:
      | component          |
      | header             |
      | explore-above-fold |
      | company-page       |
