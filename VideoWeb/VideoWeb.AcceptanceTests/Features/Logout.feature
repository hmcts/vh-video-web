Feature: Logout
	As a registered video hearings user
	I would like to logout
	So that I can sign out of my hearing account

@smoketest
Scenario: Individual logout
	Given the user is on the login page
	When the Individual attempts to login with valid credentials
	Then the Hearing List page is displayed
	When the user attempts to logout
	Then the user should be navigated to sign in screen

@smoketest
Scenario: Representative logout
	Given the user is on the login page
	When the Representative attempts to login with valid credentials
	Then the Hearing List page is displayed		
	When the user attempts to logout
	Then the user should be navigated to sign in screen