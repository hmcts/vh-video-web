Feature: Login
	As a registered video hearings user
	I would like to login
	So that I can access hearings

@smoketest
Scenario: Individual login
	Given I have a hearing and a conference
	And the user is on the login page
	When the Individual attempts to login with valid credentials
	Then the Hearing List page is displayed