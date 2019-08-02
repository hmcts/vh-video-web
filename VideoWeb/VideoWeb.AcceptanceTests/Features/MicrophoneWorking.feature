@VIH-4230
Feature: Microphone Working
	As a registered video hearings user
	I would like to confirm the microphone check was successful
	So that I can ensure my camera is ready to use for the hearing

Scenario: Participant microphone working
	Given the Participant user has progressed to the Microphone Working page
	Then contact us details are available
	When the user clicks the Check my equipment again button
	Then the Please answer this question error message appears
	When the user selects the Yes radiobutton
	Then the Check my equipment again button is disabled
	When the user clicks the Continue button
	Then the user is on the See and Hear Video page

@VIH-4595
Scenario: Participant confirms the microphone is not working
	Given the Participant user has progressed to the Microphone Working page
	When the user selects the No radiobutton
	And the user clicks the Check my equipment again button
	Then the user is on the Equipment Check page
	When the Individual user navigates from the Equipment Check page back to the Microphone Working page
	And the user selects the No radiobutton
	And the user clicks the Continue button
	Then the user is on the Help page
	And contact us details are available