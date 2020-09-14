Feature: Video Hearings Officer Call
	In order for a participant to talk to a VHO
	As a VHO
	I want to be able to call a participant

@VIH-4611 @VIH-4613 @VIH-4730 @Smoketest-Extended @DisableLogging
Scenario: Video Hearings Officer Call
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with the first Individual's
	And the first Individual's accepts the VHO call
	Then the Video Hearings Officer can see and hear the other user
	And the admin self view can be open and closed
	Then the the first Individual's can see and hear the other user
	When the Video Hearings Officer ends the call
	Then the user is on the Hearing List page

@VIH-4613 @DisableLogging
Scenario: No Answer on a Video Hearings Officer Call
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with the first Individual's
	And the user does not answer after 2 minutes
	Then the the first Individual's user can no longer see the alert

@VIH-4613 @DisableLogging
Scenario: Video Hearings Officer cannot call users in private consultation
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with the first Individual's 
	And the first Individual's accepts the private consultation from Mrs Automation01 the first Representative's
	Then the first Representative can see the other participant
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	Then the option to call the first Individual's is not visible

@VIH-4613 @DisableLogging
Scenario: Video Hearings Officer cannot call users in a hearing
	Given the the first Individual user has progressed to the Waiting Room page
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	When the Judge starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	Then the option to call the first Individual's is not visible
  When in the Judge's browser
  And the Judge clicks close
	Then the user is on the Hearing List page

@VIH-6132 @DisableLogging
Scenario: Video Hearings Officer Calls Observer
  Given I have a hearing with an Observer and Panel Member
  And the Observer user has progressed to the Waiting Room page for the existing hearing
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with Observer
	And Observer accepts the VHO call
	Then the Video Hearings Officer can see and hear the other user
	And the admin self view can be open and closed
	Then the Observer can see and hear the other user
	When the Video Hearings Officer ends the call
	Then the user is on the Hearing List page

@VIH-6132 @DisableLogging
Scenario: Video Hearings Officer Calls Panel Member
  Given I have a hearing with an Observer and Panel Member
  And the Panel Member user has progressed to the Waiting Room page for the existing hearing
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with PanelMember
	And Panel Member accepts the VHO call
	Then the Video Hearings Officer can see and hear the other user
	And the admin self view can be open and closed
	Then the Panel Member can see and hear the other user
	When the Video Hearings Officer ends the call
	Then the user is on the Hearing List page
