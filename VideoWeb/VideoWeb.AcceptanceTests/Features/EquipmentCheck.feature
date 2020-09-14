@VIH-4091
Feature: Equipment Check
	As a registered video hearings user
	I would like to start a hearing and begin an equipment check
	So that I can ensure my equipment is ready to use for the hearing

Scenario: Participant equipment check
	Given the Participant user has progressed to the Equipment Check page
	Then contact us details are available
	When the user clicks the Continue button
	Then the user is on the Switch on your camera and microphone page

@VIH-4671
Scenario: Judge equipment check
	Given the Judge Self Test user has progressed to the Equipment Check page
	Then contact us details are available
	When the user clicks the Continue button
	Then the user is on the Switch on your camera and microphone page