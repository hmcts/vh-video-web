Feature: Video Hearings Officer Call
	In order for a participant to talk to a VHO
	As a VHO
	I want to be able to call a participant

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
	When the first Representative starts a private consultation with the first Individual 
	And the first Individual accepts the private consultation from the first Representative
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
  And the Judge closes the hearing
	Then the user is on the Waiting Room page

@VIH-4611 @VIH-4613 @VIH-4730 @VIH-6132 @VIH-6420 @VIH-7413 @Smoketest-Extended @DisableLogging
Scenario: Video Hearings Officer Calls Users
  Given I have a hearing with a <User>
  And the <User> user has progressed to the Waiting Room page for the existing hearing
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with <User>
	And <User> accepts the VHO call
	Then the Video Hearings Officer can see and hear the other user
	And the admin self view can be open and closed
	Then the <User> can see and hear the other user
	When the Video Hearings Officer ends the call
	Then the user is on the Hearing List page
    Examples: 
  | User             |
  | first Individual |
	| Observer         |
  | Panel Member     |
  | Winger           |


@VIH-7413
Scenario: Video Hearings Officer Calls Both Interpretee And Interpreter
  Given I have a hearing with an Interpreter
  And the first individual user has progressed to the Waiting Room page for the existing hearing
  And the interpreter user has progressed to the Waiting Room page for the existing hearing
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with interpreter
  And first individual accepts the VHO call
	And interpreter accepts the VHO call
	Then the Video Hearings Officer can see and hear the other user
	And the admin self view can be open and closed
	Then the interpreter can see and hear the other user
	When the Video Hearings Officer ends the call
	Then the user is on the Hearing List page
