Feature: Login
	As a registered video hearings user
	I would like to login and Logout
	So that I can access and sign out of the application

Scenario: Clerk login
	Given a new browser is open for a Clerk
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	When the user attempts to logout and log back in
	Then the user should be navigated to sign in screen

Scenario: Individual login
	Given a new browser is open for an Individual
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	When the user attempts to logout and log back in
	Then the user should be navigated to sign in screen

Scenario: Representative login
	Given a new browser is open for an Representative
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	When the user attempts to logout and log back in
	Then the user should be navigated to sign in screen

Scenario: Video Hearings Officer login
	Given a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
	Then the user is on the VHO Venue List page
	When the user attempts to logout and log back in
	Then the user should be navigated to sign in screen
