@VIH-4230
Feature: Microphone Working
	As a registered video hearings user
	I would like to confirm the microphone check was successful
	So that I can ensure my camera is ready to use for the hearing

Scenario: Individual microphone working
	Given the Individual user has progressed to the Microphone Working page
	Then contact us details are available
	When the user clicks the Check my equipment again button
	Then the Please answer this question error message appears
	When the user selects the Yes radiobutton
	Then the Check my equipment again button is disabled
	When the user clicks the Continue button
	Then the user is on the See and Hear Video page

Scenario: Representative microphone working
	Given the Representative user has progressed to the Microphone Working page
	Then contact us details are available
	When the user clicks the Check my equipment again button
	Then the Please answer this question error message appears
	When the user selects the Yes radiobutton
	Then the Check my equipment again button is disabled
	When the user clicks the Continue button
	Then the user is on the See and Hear Video page

Scenario: Individual does not confirm the microphone is working
	Given the Individual user has progressed to the Microphone Working page
	When the user selects the No radiobutton
	Then an error appears prompting them to try the microphone again

Scenario: Representative does not confirm the microphone is working
	Given the Representative user has progressed to the Microphone Working page
	When the user selects the No radiobutton
	Then an error appears prompting them to try the microphone again
