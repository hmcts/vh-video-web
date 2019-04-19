@VIH-4091
Feature: Equipment Check
	As a registered video hearings user
	I would like to start a hearing and begin an equipment check
	So that I can ensure my equipment is ready to use for the hearing

Scenario: Individual equipment check
	Given the Individual user has progressed to the Equipment Check page
	Then contact us details are available
	When the user clicks the Continue button
	Then the user is on the Switch on your camera and microphone page

Scenario: Representative equipment check
	Given the Representative user has progressed to the Equipment Check page
	Then contact us details are available
	When the user clicks the Continue button
	Then the user is on the Switch on your camera and microphone page