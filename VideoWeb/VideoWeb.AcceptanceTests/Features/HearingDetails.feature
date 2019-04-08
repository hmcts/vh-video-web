Feature: Hearing Details
	As a registered video hearings user
	I would like to login and access the hearing details
	So that I can have an overview of all the scheduled hearings I am involved in

@smoketest
Scenario: Individual has 1 or more hearings
	Given I have a hearing and a conference
	And the user is on the login page
	When the Individual attempts to login with valid credentials
	Then the Hearing List page is displayed
	And the user can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks the Start Hearing button
	Then the user is on the equipment check page

@smoketest
Scenario: Representative has 1 or more hearings
	Given I have a hearing and a conference
	And the user is on the login page
	When the Representative attempts to login with valid credentials
	Then the Hearing List page is displayed
	And the user can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks the Start Hearing button
	Then the user is on the equipment check page

Scenario: Individual has a hearing more than 30 minutes in the future
	Given I have a hearing and a conference in 31 minutes time
	And the user is on the login page
	When the Individual attempts to login with valid credentials
	Then the Hearing List page is displayed
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks the Start Hearing button
	Then the user is on the equipment check page

Scenario: Representative has a hearing more than 30 minutes in the future
	Given I have a hearing and a conference in 31 minutes time
	And the user is on the login page
	When the Representative attempts to login with valid credentials
	Then the Hearing List page is displayed
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks the Start Hearing button
	Then the user is on the equipment check page

@smoketest
Scenario: Individual has no hearings
	Given the user is on the login page
	When the Individual with no hearings attempts to login with valid credentials
	Then the Hearing List page is displayed
	And a warning message appears indicating the user has no hearings scheduled
	And contact us details are available

@smoketest
Scenario: Representative has no hearings
	Given the user is on the login page
	When the Representative with no hearings attempts to login with valid credentials
	Then the Hearing List page is displayed
	And a warning message appears indicating the user has no hearings scheduled
	And contact us details are available