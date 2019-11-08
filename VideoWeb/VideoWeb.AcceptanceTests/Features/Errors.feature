@VIH-4350
Feature: Error Pages
	As a registered video hearings user
	I would expect information error messages when things go wrong
	So that I know how to 

Scenario: Page not found error
	Given a new browser is open for a Participant
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	When the user attempts to navigate to a nonexistent page
	Then the user is on the Not Found page
	And the Not Found error page displays text of how to rectify the problem
	And contact us details are available

@VIH-5235
Scenario: Unauthorised error page
	Given a new browser is open for a Case admin
	When the user attempts to login with valid credentials
	Then the user is on the Unauthorised page
	And the Unauthorised error page displays text of how to rectify the problem

@VIH-4677 @UnsupportedBrowser @Smoketest
Scenario: Unsupported browser error page
	Given a new browser is open for a Participant
	When the user attempts to login with valid credentials
	Then the Unsupported Browser error page displays text of how to rectify the problem