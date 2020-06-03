@VIH-4252
Feature: Hearing Room
	In order to conduct a video hearing
	As a registered user
	I want to be able to access the video hearing room and interact with the controls

@VIH-4610 @VIH-4615 @HearingTest @Smoketest-Extended @DisableLogging
Scenario: Clerk pauses and closes hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	Then the participant status for Individual01 is displayed as Connected
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
  Then the hearing status changed to InSession
	And the Clerk is on the Hearing Room page for 20 seconds
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
  And the participant is on the Hearing Room page for 1 minute
  When in the Clerk's browser
  And the Clerk clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed

@HearingTest @Smoketest-Extended @DisableLogging
Scenario: Two participants join hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Clerk is on the Hearing Room page for 1 minute
	And the Clerk can see the participants
	And Individual01 can see the other participants
	And Representative01 can see the other participants
  When in the Clerk's browser
  And the Clerk clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
	When in Individual01's browser
	Then the participants waiting room displays the closed status

@HearingTest @Smoketest-Extended @DisableLogging
Scenario: Four participants join hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And the Individual02 user has progressed to the Waiting Room page for the existing hearing
	And the Representative02 user has progressed to the Waiting Room page for the existing hearing
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Clerk is on the Hearing Room page for 2 minutes
	And the Clerk can see the participants
	And Individual01 can see the other participants
	And Representative01 can see the other participants
	And Individual02 can see the other participants
	And Representative02 can see the other participants
  When in the Clerk's browser
  And the Clerk clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
	When in Individual01's browser
	Then the participants waiting room displays the closed status

  @HearingTest @Smoketest-Extended @DisableLogging @AudioRecording
Scenario: Audio Recording
  Given I have a hearing with audio recording enabled
  And the Individual01 user has progressed to the Waiting Room page for the existing hearing
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	When the Clerk starts the hearing
	And the countdown finishes
	And the Clerk is on the Hearing Room page for 20 seconds
  When the Clerk clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
  And an audio recording of the hearing has been created

@HearingTest @Smoketest-Extended @DisableLogging
Scenario: VHO Monitors Hearing
  Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the VHO can see the Clerk status is Unavailable
  And the VHO can see the participants statuses are Not signed in
  Given the Individual01 user has progressed to the Waiting Room page for the existing hearing
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
  And in the Video Hearings Officer's browser
  Then the VHO can see the Clerk status is Available
  And the VHO can see the status of participant Individual01 is Available
  And the VHO can see that Individual01 is in the Waiting Room
  When in the Clerk's browser
  And the Clerk starts the hearing
	And the countdown finishes
  And the Clerk is on the Hearing Room page for 20 seconds
  And in the Video Hearings Officer's browser
  Then the VHO can see the Clerk status is In hearing
  And the VHO can see the status of participant Individual01 is In hearing
  And the VHO can see that the Judge and Individual01 participants are in the Hearing Room
  When in the Clerk's browser
  When the Clerk clicks close
	Then the user is on the Hearing List page
  When in the Video Hearings Officer's browser
  Then the VHO can see the Clerk status is Unavailable
  And the VHO can see the status of participant Individual01 is Available
  And the VHO can see that Individual01 is in the Waiting Room
