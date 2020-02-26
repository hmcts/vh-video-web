Feature: Instant Messaging
	As a video hearings officer or clerk
	I need to have a quick method of resolving technical issues
	So that I can run a hearing smoothly

@VIH-5517
Scenario: Instant Messaging
	Given the Clerk user has progressed to the Waiting Room page
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer instant messages the Clerk
  Then the Clerk can see the notification for the message
  When the Clerk opens the chat window
	Then the Clerk can see the message
	When the Clerk instant messages the Video Hearings Officer
  Then the Video Hearings Officer can see the notification for the message
  And the Video Hearings Officer can see the message
  When the Clerk closes the chat window
  Then the Clerk can no longer see the messages

@VIH-5517
Scenario: Instant Messaging Clerk logged in first
	Given the Clerk user has progressed to the Waiting Room page
  When the Clerk opens the chat window
	When the Clerk instant messages the Video Hearings Officer
  Given the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  Then the Video Hearings Officer can see the notification for the message
  And the Video Hearings Officer can see the message
  When the Video Hearings Officer instant messages the Clerk
  Then the Clerk can see the notification for the message
  And the Clerk can see the message

@VIH-5517
Scenario: VHO cannot IM a Clerk when they are not in the waiting room
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	When the Video Hearings Officer attempts to send an instant messages to the clerk who is not in the waiting room
