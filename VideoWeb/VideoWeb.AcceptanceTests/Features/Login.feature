Feature: Login
	As a registered video hearings user
	I would like to login and Logout
	So that I can access and sign out of the application

Scenario: Judge login
	Given the Judge is on the login page
  When they attempt to login with valid credentials
  Then they should be on the Hearing List page
  And they should have the option to log back in when they logout

Scenario: Individual login
  Given the Individual is on the login page
	When they attempt to login with valid credentials
	Then they should be on the Hearing List page
	And they should have the option to log back in when they logout

Scenario: Representative login
  Given the Representative is on the login page
  When they attempt to login with valid credentials
  Then they should be on the Hearing List page
  And they should have the option to log back in when they logout

Scenario: Video Hearings Officer login
  Given the Video Hearings Officer is on the login page
  When they attempt to login with valid credentials
  Then they should be on the VHO Venue List page
  And they should have the option to log back in when they logout
