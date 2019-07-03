@VIH-4289
Feature: See and Hear Video
	As a registered video hearings user
	I would like to confirm the equipment check was successful
	So that I can ensure my equipment is ready to use for the hearing

Scenario: Individual see and hear video
	Given the Individual user has progressed to the See and Hear Video page
	Then contact us details are available
	When the user clicks the Check my equipment again button
	Then the Please answer this question error message appears
	When the user selects the Yes radiobutton
	Then the Check my equipment again button is disabled
	When the user clicks the Continue button
	Then the user is on the Rules page

Scenario: Representative see and hear video
	Given the Representative user has progressed to the See and Hear Video page
	Then contact us details are available
	When the user clicks the Check my equipment again button
	Then the Please answer this question error message appears
	When the user selects the Yes radiobutton
	Then the Check my equipment again button is disabled
	When the user clicks the Continue button
	Then the user is on the Rules page

@VIH-4595
Scenario: Individual does not confirm the equipment is working
	Given the Individual user has progressed to the See and Hear Video page
	When the user selects the No radiobutton
	And the user clicks the Check my equipment again button
	Then the user is on the Equipment Check page
	When the Individual user navigates from the Equipment Check page back to the See and Hear Video page
	And the user selects the No radiobutton
	And the user clicks the Continue button
	Then the user is on the Help page
	And contact us details are available

@VIH-4595
Scenario: Representative does not confirm the equipment is working
	Given the Representative user has progressed to the See and Hear Video page
	When the user selects the No radiobutton
	And the user clicks the Check my equipment again button
	Then the user is on the Equipment Check page
	When the Representative user navigates from the Equipment Check page back to the See and Hear Video page
	And the user selects the No radiobutton
	And the user clicks the Continue button
	Then the user is on the Help page
	And contact us details are available
