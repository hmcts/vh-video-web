@VIH-4133 @VIH-4355 
Feature: Practice video hearing
	In order to check if my camera and microphone is working
	As a participant in a video hearing
	I want to be able to see my microphone and camera are responding

@Video @Smoketest-Extended
Scenario: Individual video hearing practice
	Given the Individual user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	Then the test score should be produced
	When the user clicks the Watch the video again button
	Then the incoming and self video should be playing video
	When the user changes the camera and microphone
	Then the choose your camera and microphone popup should disappear

@VIH-5386 @Video @Smoketest-Extended
Scenario: Individual self test video hearing practice
	Given the Individual Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	And the user clicks the Check equipment again button
	Then the incoming and self video should be playing video
	When the user changes the camera and microphone
	Then the choose your camera and microphone popup should disappear

@VIH-4997 @Video
Scenario: Representative self test video hearing practice
	Given the Representative Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	And the user clicks the Check equipment again button
	Then the incoming and self video should be playing video
	When the user changes the camera and microphone
	Then the choose your camera and microphone popup should disappear

@VIH-4671 @Video
Scenario: Clerk video hearing practice
	Given the Clerk Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	And the user clicks the Check equipment again button
	Then the incoming and self video should be playing video
	When the user changes the camera and microphone
	Then the choose your camera and microphone popup should disappear

@VIH-4671 @Video
Scenario: Clerk confirms the equipment is working
	Given the Clerk Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	When the user clicks the Equipment is working button
	Then the user is on the Hearing List page

@VIH-4671 @Video
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

Scenario: Panel member video hearing practice
	Given the Panel Member Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	And contact us details are available
	When the video has ended
	And the user clicks the Check equipment again button
	Then the incoming and self video should be playing video
	When the user changes the camera and microphone
	Then the choose your camera and microphone popup should disappear

@VIH-6140
Scenario: Panel member confirms the equipment is working
	Given the Panel Member Self Test user has progressed to the Practice video hearing page
	Then the incoming and self video should be playing video
	When the user clicks the Equipment is working button
	Then the user is on the Hearing List page
