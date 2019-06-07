@VIH-4035
Feature: Hearings List
	As a registered video hearings user
	I would like to login and access the hearing details
	So that I can have an overview of all the scheduled hearings I am involved in

Scenario: Individual has 1 or more hearings
	Given I have a hearing and a conference
	And the login page is open
	When the Individual attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the participant can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

@smoketest
Scenario: Representative has 1 or more hearings
	Given I have a hearing and a conference
	And the login page is open
	When the Representative attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the participant can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

Scenario: Individual has a hearing more than 30 minutes in the future
	Given I have a hearing and a conference in 31 minutes time
	And the login page is open
	When the Individual attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

Scenario: Representative has a hearing more than 30 minutes in the future
	Given I have a hearing and a conference in 31 minutes time
	And the login page is open
	When the Representative attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

Scenario: Individual has no hearings
	Given the login page is open
	When the Individual with no hearings attempts to login with valid credentials
	Then the user is on the Hearings List page
	And a warning message appears indicating the user has no hearings scheduled
	And contact us details are available

Scenario: Representative has no hearings
	Given the login page is open
	When the Representative with no hearings attempts to login with valid credentials
	Then the user is on the Hearings List page
	And a warning message appears indicating the user has no hearings scheduled
	And contact us details are available

Scenario: Judge has no hearings
	Given the login page is open
	When the Judge with no hearings attempts to login with valid credentials
	Then the user is on the Hearings List page
	And a warning message appears indicating the user has no hearings scheduled
	And contact us details are available

Scenario: Judge has 1 or more hearings
	Given I have a hearing and a conference
	And the login page is open
	When the Judge attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the Judge can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Waiting Room page

@VIH-4156
Scenario: Video Hearings Officer has no hearings
	Given the login page is open
	When the Video Hearings Officer attempts to login with valid credentials
	Then the user is on the Hearings List page
	And a warning message appears indicating the user has no hearings scheduled

@VIH-4156 @smoketest
Scenario: Video Hearings Officer has 1 or more hearings
	Given I have a hearing and a conference
	And the login page is open
	When the Video Hearings Officer attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the VHO can see a list of hearings including the new hearing
	When the VHO selects the hearing
	Then the VHO can see the hearing view