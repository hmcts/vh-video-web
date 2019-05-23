@VIH-4252
Feature: HearingRoom
	In order to conduct a video hearing
	As a registered user
	I want to be able to access the video hearing room and interact with the controls

Scenario: Judge starts hearing
	Given the Judge user has progressed to the Waiting Room page
	When the user clicks the button with innertext Start Hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page
	And the hearing controls are visible
	And the user can see themselves and toggle the view off and on

Scenario: Participants join hearing
	Given the Individual user has progressed to the Waiting Room page
	And in another browser
	And the Representative user has progressed to the Waiting Room page
	And in another browser
	And the Judge user has progressed to the Waiting Room page
	When the user clicks the button with innertext Start Hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page
	And the hearing controls are visible
	And the user can see themselves and toggle the view off and on