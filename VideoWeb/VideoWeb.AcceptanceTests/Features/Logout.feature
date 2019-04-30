Feature: Logout
	As a registered video hearings user
	I would like to logout
	So that I can sign out of my hearing account

@smoketest
Scenario: Judge logout
	Given the login page is open
	When the Judge attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

@smoketest
Scenario: Individual logout
	Given the login page is open
	When the Individual attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

@smoketest
Scenario: Representative logout
	Given the login page is open
	When the Representative attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen

@smoketest
Scenario: Video Hearings Officer logout
	Given the login page is open
	When the Video Hearings Officer attempts to login with valid credentials
	Then the user is on the Hearings List page
	When the user attempts to logout
	Then the user should be navigated to sign in screen