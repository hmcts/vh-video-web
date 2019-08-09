Feature: Logout
	As a registered video hearings user
	I would like to logout
	So that I can sign out of my hearing account

Scenario: Clerk logout
	Given a new browser is open for a Clerk
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

Scenario: Individual logout
	Given a new browser is open for an Individual
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

Scenario: Representative logout
	Given a new browser is open for an Representative
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

Scenario: Video Hearings Officer logout
	Given a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
	Then the user is on the VHO Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen