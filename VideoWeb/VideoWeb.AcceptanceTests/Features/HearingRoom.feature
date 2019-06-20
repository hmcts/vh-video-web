@VIH-4252 @Chrome
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

Scenario: Two participants join hearing
	Given the Individual user has progressed to the Waiting Room page
	And there is a new browser open for Representative01
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Judge
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	When the user clicks the button with innertext Start Hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page for 1 minute

Scenario: Four participants join hearing
	Given the Individual user has progressed to the Waiting Room page
	And there is a new browser open for Representative01
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Individual02
	And the Individual02 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Representative02
	And the Representative02 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Judge
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	When the user clicks the button with innertext Start Hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page for 2 minutes