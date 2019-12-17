@VIH-4133 @VIH-4355 
Feature: Practice video hearing
	In order to check if my camera and microphone is working
	As a participant in a video hearing
	I want to be able to see my microphone and camera are responding

@Chrome @Firefox @Video
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

@VIH-5386 @Chrome @Firefox @Video
Scenario: Individual self test video hearing practice
	Given the Individual Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	And the user clicks the Check equipment again button
	Then the incoming and self video should be playing video
	When the user clicks the Change camera or microphone link
	Then the choose your camera and microphone popup should appear
	When the user selects a new microphone
	Then the choose your camera and microphone popup should disappear

@VIH-4997 @Chrome @Firefox @Video
Scenario: Representative self test video hearing practice
	Given the Representative Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	And the user clicks the Check equipment again button
	Then the incoming and self video should be playing video
	When the user clicks the Change camera or microphone link
	Then the choose your camera and microphone popup should appear
	When the user selects a new microphone
	Then the choose your camera and microphone popup should disappear

@VIH-4671 @Chrome @Firefox @Video
Scenario: Clerk video hearing practice
	Given the Clerk Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	And the user clicks the Check equipment again button
	Then the incoming and self video should be playing video
	When the user clicks the Change camera or microphone link
	Then the choose your camera and microphone popup should appear
	When the user selects a new microphone
	Then the choose your camera and microphone popup should disappear

@VIH-4671 @Chrome @Firefox @Video
Scenario: Clerk confirms the equipment is working
	Given the Clerk Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	When the user clicks the Equipment is working button
	Then the user is on the Hearing List page

@VIH-4671 @Chrome @Firefox @Video
Scenario: Clerk does not confirm the equipment is working
	Given the Clerk Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	When the user clicks the Equipment is faulty button
	Then the user can see contact details to help resolve the issues
	And contact us details are available
	When the user clicks the Check equipment again button
	Then the user is on the Practice video hearing page
	When the user clicks the Check equipment again button
	And the user clicks the Equipment is faulty button
	When the user clicks the Continue button
	Then the user is on the Hearing List page