Feature: Camera and Microphone check
	As a registered video hearings user
	I would like to begin a camera and microphone check
	So that I can ensure my equipment is ready to use for the hearing

Scenario: Individual camera and microphone check
	Given the Individual user has progressed to the Camera and Microphone page
	#Then contact us details are available
	When the user clicks the Continue button
	Then the user is on the Rules page

Scenario: Representative camera and microphone check
	Given the Representative user has progressed to the Camera and Microphone page
	#Then contact us details are available
	When the user clicks the Continue button
	Then the user is on the Rules page
