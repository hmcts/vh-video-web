Feature: Login
	As a registered video hearings user
	I would like to login
	So that I can access hearings

Scenario: Judge login
	Given I have a hearing and a conference
	And a new browser is open for a Judge
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed

Scenario: Clerk login
	Given I have a hearing and a conference
	And a new browser is open for a Clerk
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed

Scenario: Individual login
	Given I have a hearing and a conference
	And a new browser is open for an Individual
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed

Scenario: Representative login
	Given I have a hearing and a conference
	And a new browser is open for a Representative
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed

Scenario: Video Hearings Officer login
	Given I have a hearing and a conference
	And a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed