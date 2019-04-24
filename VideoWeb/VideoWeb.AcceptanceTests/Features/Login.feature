Feature: Login
	As a registered video hearings user
	I would like to login
	So that I can access hearings

Scenario: Judge login
	Given I have a hearing and a conference
	And the login page is open
	When the Judge attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed

Scenario: Individual login
	Given I have a hearing and a conference
	And the login page is open
	When the Individual attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed

Scenario: Representative login
	Given I have a hearing and a conference
	And the login page is open
	When the Representative attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed

Scenario: Video Hearings Officer login
	Given I have a hearing and a conference
	And the login page is open
	When the Video Hearings Officer attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the sign out link is displayed