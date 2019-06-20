@Chrome
Feature: Practice video hearing
	In order to check if my camera and microphone is working
	As a participant in a video hearing
	I want to be able to see my microphone and camera are responding

@VIH-4133 @VIH-4355 
Scenario: Individual video hearing practice
	Given the Individual user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	Then the test score should be produced
	When the user clicks the Re-play the video message button
	Then the incoming and self video should be playing video
	When the user clicks the Change camera or microphone link
	Then the choose your camera and microphone popup should appear
	When the user selects a new microphone
	Then the choose your camera and microphone popup should disappear

@VIH-4133 @VIH-4355 
Scenario: Representative video hearing practice
	Given the Representative user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	Then the test score should be produced
	When the user clicks the Re-play the video message button
	Then the incoming and self video should be playing video
	When the user clicks the Change camera or microphone link
	Then the choose your camera and microphone popup should appear
	When the user selects a new microphone
	Then the choose your camera and microphone popup should disappear
