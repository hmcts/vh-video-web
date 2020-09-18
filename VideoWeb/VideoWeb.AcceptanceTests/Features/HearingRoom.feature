@VIH-4252
Feature: Hearing Room
	In order to conduct a video hearing
	As a registered user
	I want to be able to access the video hearing room and interact with the controls

@VIH-4610 @VIH-4615 @HearingTest @Smoketest-Extended @DisableLogging
Scenario: Judge pauses and closes hearing
	Given the the first Individual user has progressed to the Waiting Room page
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	Then the participant status for the first Individual's is displayed as Connected
	When the Judge starts the hearing
	And the countdown finishes
  Then the hearing status changed to InSession
	And the Judge is on the Hearing Room page for 20 seconds
	When the Judge clicks pause
	Then the user is on the Waiting Room page
	And the Judge waiting room displays the paused status
	And the hearing status changed to Paused
	When in the first Individual's browser
	Then the participants waiting room displays the paused status
	When in the Judge's browser
	And the Judge resumes the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the user is on the Hearing Room page
	When in the first Individual's browser
	Then the participant is back in the hearing
  And the participant is on the Hearing Room page for 1 minute
  When in the Judge's browser
  And the Judge clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed

@HearingTest @Smoketest-Extended @DisableLogging
Scenario: Two participants join hearing
	Given the the first Individual user has progressed to the Waiting Room page
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	When the Judge starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Judge is on the Hearing Room page for 1 minute
	And the Judge can see the participants
	And the first Individual can see the other participants
	And the first Representative can see the other participants
  When in the Judge's browser
  And the Judge clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
	When in the first Individual's browser
	Then the participants waiting room displays the closed status

@HearingTest @Smoketest-Extended @DisableLogging
Scenario: Four participants join hearing
	Given the the first Individual user has progressed to the Waiting Room page
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	And the the second Individual user has progressed to the Waiting Room page for the existing hearing
	And the the second Representative user has progressed to the Waiting Room page for the existing hearing
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	When the Judge starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Judge is on the Hearing Room page for 1 minutes
	And the Judge can see the participants
	And the first Individual can see the other participants
	And the first Representative can see the other participants
	And the second Individual can see the other participants
	And the second Representative can see the other participants
  When in the Judge's browser
  And the Judge clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
	When in the first Individual's browser
	Then the participants waiting room displays the closed status

  @HearingTest @Smoketest-Extended @Smoketest-Prod @AudioRecording @DisableLogging
Scenario: Audio Recording
  Given I have a hearing with audio recording enabled
  And the the first Individual user has progressed to the Waiting Room page for the existing hearing
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	When the Judge starts the hearing
	And the countdown finishes
	And the Judge is on the Hearing Room page for 20 seconds
  When the Judge clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
  And an audio recording of the hearing has been created

@HearingTest @Smoketest-Extended @DisableLogging
Scenario: VHO Monitors Hearing
  Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the VHO can see the Judge status is Unavailable
  And the VHO can see the participants statuses are Not signed in
  Given the the first Individual user has progressed to the Waiting Room page for the existing hearing
	And the Judge user has progressed to the Waiting Room page for the existing hearing
  And in the Video Hearings Officer's browser
  Then the VHO can see the Judge status is Available
  And the VHO can see the status of participant the first Individual's is Available
  And the VHO can see that the first Individual's is in the Waiting Room
  When in the Judge's browser
  And the Judge starts the hearing
	And the countdown finishes
  And the Judge is on the Hearing Room page for 20 seconds
  And in the Video Hearings Officer's browser
  Then the VHO can see the Judge status is In hearing
  And the VHO can see the status of participant the first Individual's is In hearing
  And the VHO can see that the Judge and the first Individual's participants are in the Hearing Room
  When in the Judge's browser
  When the Judge clicks close
	Then the user is on the Hearing List page
  When in the Video Hearings Officer's browser
  Then the VHO can see the Judge status is Disconnected
  And the VHO can see the status of participant the first Individual's is Available
  And the VHO can see that the first Individual's is in the Waiting Room

@HearingTest @Smoketest-Extended @DisableLogging
Scenario: Observer and Panel Member join hearing
  Given I have a hearing with an Observer and Panel Member
	And the Observer user has progressed to the Waiting Room page for the existing hearing
	And the Panel Member user has progressed to the Waiting Room page for the existing hearing
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	When the Judge starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Then the Judge is on the Hearing Room page for 30 seconds
	And the Judge can see the participants
	And the Observer can see the other participants
	And the Panel Member can see the other participants
  When in the Judge's browser
  And the Judge clicks close
	Then the user is on the Hearing List page
	And the hearing status changed to Closed
	When in the Observer's browser
	Then the participants waiting room displays the closed status
