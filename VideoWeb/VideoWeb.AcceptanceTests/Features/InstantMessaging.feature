Feature: Instant Messaging
	As a video hearings officer or clerk
	I need to have a quick method of resolving technical issues
	So that I can run a hearing smoothly

@VIH-5517 @Smoketest-Extended
Scenario: Clerk Instant Messaging
	Given the Clerk user has progressed to the Waiting Room page
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer instant messages the Clerk user
  Then the Clerk user can see the notification for the message
  When the Clerk user opens the chat window
	Then the Clerk user can see the message
	When the Clerk user instant messages the Video Hearings Officer
  When the Video Hearings Officer navigates to the message from the Clerk user
  Then the Video Hearings Officer user can see the message 
  When the Clerk user closes the chat window
  Then the user can no longer see the messages

@VIH-5862 @Smoketest-Extended
Scenario: Participant Instant Messaging
	Given the Individual01 user has progressed to the Waiting Room page
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer instant messages the Individual01 user
  Then the Individual01 user can see the notification for the message
  When the Individual01 user opens the chat window
	Then the Individual01 user can see the message
	When the Individual01 user instant messages the Video Hearings Officer
  When the Video Hearings Officer navigates to the message from the Individual01 user
  Then the Video Hearings Officer user can see the message 
  When the Individual01 user closes the chat window
  Then the user can no longer see the messages

@VIH-5517
Scenario: Instant Messaging Video Hearings Officer logged in first
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
  When the Video Hearings Officer instant messages the Clerk user
  And the Clerk user has progressed to the Waiting Room page for the existing hearing
  Then the Clerk user can see the notification for the message
  When the Clerk user opens the chat window
	Then the Clerk user can see the message
	When the Clerk user instant messages the Video Hearings Officer
  Then the Video Hearings Officer user can see the message

@VIH-5517 
Scenario: Instant Messaging Clerk logged in first
	Given the Clerk user has progressed to the Waiting Room page
  When the Clerk user opens the chat window
	And the Clerk user instant messages the Video Hearings Officer
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  And the Video Hearings Officer navigates to the message from the Clerk user
  Then the Video Hearings Officer user can see the message
  When the Video Hearings Officer instant messages the Clerk user
  Then the Clerk user can see the message

@VIH-5862
Scenario: Instant Messaging Participant logged in first
	Given the Individual01 user has progressed to the Waiting Room page
  When the Individual01 user opens the chat window
	And the Individual01 user instant messages the Video Hearings Officer
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  And the Video Hearings Officer navigates to the message from the Individual01 user
  Then the Video Hearings Officer user can see the message
  When the Video Hearings Officer instant messages the Individual01 user
  Then the Individual01 user can see the message

@VIH-5517
Scenario: Instant Messaging multiple messages
	Given the Clerk user has progressed to the Waiting Room page
  When the Clerk user opens the chat window
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	And the VHO and Clerk send 2 messages to each other
  Then they can see all the messages
