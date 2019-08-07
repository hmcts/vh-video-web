@VIH-4289 @VIH-4036
Feature: Switch on your camera and microphone
	As a registered video hearings user
	I would like to be prompted to switch on my camera and microphone
	So that I can ensure my equipment is ready to use for the hearing

Scenario: Participant switch on camera and microphone
	Given the Participant user has progressed to the Switch on your camera and microphone page
	Then contact us details are available
	When the user clicks the Switch on button
	Then the camera and microphone turned on success message appears
	When the user clicks the Watch video button
	Then the user is on the Camera Working page

@VIH-4671 
Scenario: Clerk switch on camera and microphone
	Given the ClerkSelfTest user has progressed to the Switch on your camera and microphone page
	Then contact us details are available
	When the user clicks the Switch on button
	Then the camera and microphone turned on success message appears
	When the user clicks the Watch video button
	Then the user is on the Practice video hearing page
