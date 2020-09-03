Feature: Instant Messaging
	As a video hearings officer or Judge
	I need to have a quick method of resolving technical issues
	So that I can run a hearing smoothly

@VIH-5517 @Smoketest-Extended
Scenario: Judge Instant Messaging
	Given the Judge user has progressed to the Waiting Room page
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer instant messages the Judge user
	Then the Judge user can see the message
	When the Judge user instant messages the Video Hearings Officer
  When the Video Hearings Officer navigates to the message from the Judge user
  Then the Video Hearings Officer user can see the message 
  When the Judge user closes the chat window
  Then the user can no longer see the messages

@VIH-5862 @Smoketest-Extended
Scenario: Participant Instant Messaging
	Given the the first Individual user has progressed to the Waiting Room page
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer instant messages the the first Individual's user
	Then the the first Individual's user can see the message
	When the the first Individual's user instant messages the Video Hearings Officer
  When the Video Hearings Officer navigates to the message from the the first Individual's user
  Then the Video Hearings Officer user can see the message 
  When the the first Individual's user closes the chat window
  Then the user can no longer see the messages

@VIH-5517
Scenario: Instant Messaging Video Hearings Officer logged in first
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
  When the Video Hearings Officer instant messages the Judge user
  And the Judge user has progressed to the Waiting Room page for the existing hearing
	Then the Judge user can see the message
	When the Judge user instant messages the Video Hearings Officer
  Then the Video Hearings Officer user can see the message

@VIH-5517 
Scenario: Instant Messaging Judge logged in first
	Given the Judge user has progressed to the Waiting Room page
  When the Judge user opens the chat window
	And the Judge user instant messages the Video Hearings Officer
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  And the Video Hearings Officer navigates to the message from the Judge user
  Then the Video Hearings Officer user can see the message
  When the Video Hearings Officer instant messages the Judge user
  Then the Judge user can see the message

@VIH-5862
Scenario: Instant Messaging Participant logged in first
	Given the the first Individual user has progressed to the Waiting Room page
  When the the first Individual's user opens the chat window
	And the the first Individual's user instant messages the Video Hearings Officer
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  And the Video Hearings Officer navigates to the message from the the first Individual's user
  Then the Video Hearings Officer user can see the message
  When the Video Hearings Officer instant messages the the first Individual's user
  Then the the first Individual's user can see the message

@VIH-5517
Scenario: Instant Messaging multiple messages
	Given the Judge user has progressed to the Waiting Room page
  When the Judge user opens the chat window
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	And the VHO and Judge send 2 messages to each other
  Then they can see all the messages
