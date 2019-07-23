@VIH-4252
Feature: HearingRoom
	In order to conduct a video hearing
	As a registered user
	I want to be able to access the video hearing room and interact with the controls

@Chrome @Video @VIH-4610
Scenario: Clerk starts hearing
	Given the Clerk user has progressed to the Waiting Room page
	Then the hearing status changed to NotStarted
	And the participant status for Individual01 is displayed as Not signed in
	When the user clicks the button with innertext Start video call
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page
	And the hearing status changed to InSession
	And the hearing controls are visible
	And the user can see themselves and toggle the view off and on

@Chrome @Video @VIH-4615
Scenario: Clerk pauses hearing
	Given the Individual user has progressed to the Waiting Room page
	And there is a new browser open for Clerk
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	Then the participant status for Individual01 is displayed as Connected
	When the user clicks the button with innertext Start video call
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page for 10 seconds
	When the user clicks pause
	Then the user is on the Waiting Room page
	And the waiting room displays the paused status
	And the hearing status changed to Paused
	And the user resumes the hearing

@Chrome @Video
Scenario: Two participants join hearing
	Given the Individual user has progressed to the Waiting Room page
	And there is a new browser open for Representative01
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Clerk
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	When the user clicks the button with innertext Start video call
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page for 1 minute

@Chrome @Video
Scenario: Four participants join hearing
	Given the Individual user has progressed to the Waiting Room page
	And there is a new browser open for Representative01
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Individual02
	And the Individual02 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Representative02
	And the Representative02 user has progressed to the Waiting Room page for the existing hearing
	And there is a new browser open for Clerk
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	When the user clicks the button with innertext Start video call
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page for 2 minutes