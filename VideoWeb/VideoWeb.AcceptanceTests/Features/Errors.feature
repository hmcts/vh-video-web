@VIH-4350
Feature: Error Pages
	As a registered video hearings user
	I would expect information error messages when things go wrong
	So that I know how to 

Scenario: Page not found error
	Given the login page is open
	When the Individual attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to navigate to a nonexistent page
	Then the user is on the Not Found page
	And the Not Found error page displays text of how to rectify the problem
	And contact us details are available

Scenario: Page not authorised error
	Given the Individual user has progressed to the Waiting Room page
	Then the user is on the Waiting Room page
	When the user is removed from the hearing
	And the user tries to navigate back to the waiting room page
	Then the user is on the Unauthorised page
	And the Unauthorised error page displays text of how to rectify the problem
	And contact us details are available