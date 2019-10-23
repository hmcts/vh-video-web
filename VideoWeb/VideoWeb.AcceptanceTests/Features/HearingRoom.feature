@VIH-4252
Feature: HearingRoom
	In order to conduct a video hearing
	As a registered user
	I want to be able to access the video hearing room and interact with the controls

@Chrome @Video @VIH-4610 @HearingTest
Scenario: Clerk starts hearing
	Given the Clerk user has progressed to the Waiting Room page
	Then the hearing status changed to NotStarted
	And the participant status for Individual01 is displayed as Not signed in
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page
	And the hearing status changed to InSession
	And the hearing controls are visible
	And the user can see themselves and toggle the view off and on

@Chrome @Video @VIH-4615 @HearingTest
Scenario: Clerk pauses hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	Then the participant status for Individual01 is displayed as Connected
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Clerk is on the Hearing Room page for 20 seconds
	When the Clerk clicks pause
	Then the user is on the Waiting Room page
	And the Clerk waiting room displays the paused status
	And the hearing status changed to Paused
	When in Individual01's browser
	Then the participants waiting room displays the paused status
	When in the Clerk's browser
	And the Clerk resumes the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page
	When in Individual01's browser
	Then the participant is back in the hearing

@Chrome @Video @VIH-4615 @HearingTest
Scenario: Clerk closes hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	Then the participant status for Individual01 is displayed as Connected
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Clerk is on the Hearing Room page for 10 seconds
	When the Clerk clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
	When in Individual01's browser
	Then the participants waiting room displays the closed status

@Chrome @Video @HearingTest
Scenario: Two participants join hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Clerk is on the Hearing Room page for 1 minute
	And Clerk can see the other participants
	And Individual01 can see the other participants
	And Representative01 can see the other participants

# Ignoring test as Saucelabs is not powerful enough to run the test consistently without at least
# 1 participant being disocnnected by the time the hearing is due to start. On a sufficiently powerful 
# machine this test should still be able to run.
@Chrome @Video @HearingTest @Ignore 
Scenario: Four participants join hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And the Individual02 user has progressed to the Waiting Room page for the existing hearing
	And the Representative02 user has progressed to the Waiting Room page for the existing hearing
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	And all the participants refresh their browsers
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Clerk is on the Hearing Room page for 2 minutes
	And Clerk can see the other participants
	And Individual01 can see the other participants
	And Representative01 can see the other participants
	And Individual02 can see the other participants
	And Representative02 can see the other participants