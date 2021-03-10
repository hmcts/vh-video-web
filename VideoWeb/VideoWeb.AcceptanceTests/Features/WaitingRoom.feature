@VIH-4127 @VIH-4131 @VIH-4233
Feature: Waiting Room
	As a registered video hearings user
	I need to access a waiting room prior to my hearing
	So that I am ready for the video hearing to begin

@VIH-4233 @Smoketest @Smoketest-Extended
Scenario: Participant waiting room
	Given the Participant user has progressed to the Waiting Room page
	Then the user is on the Waiting Room page
	And a phone number for help is provided
	And the users status has updated to Available
	And the participant can see information about their case
	And the Participant can see a list of participants and their representatives
	And the user can see a black box and an about to begin message

@VIH-7149
Scenario: Participant waiting room with Interpreter
	Given the Participant user with an Interpreter has progressed to the Waiting Room page
	Then the user is on the Waiting Room page
	And a phone number for help is provided
	And the users status has updated to Available
	And the participant can see information about their case
	And the Participant can see a list of participants and their representatives
  And the Interpreter below their own entry in the participant list

@VIH-4610 @Smoketest @Smoketest-Extended
Scenario: Judge waiting room
	Given the Judge user has progressed to the Waiting Room page
	Then the user is on the Waiting Room page
	And a phone number for help is provided
	And the users status has updated to Available
	And the Judge can see information about their case 
  And the Judge can see a list of participants and their representatives
	And the Judge can see other participants status
  When the judge opens the change camera and microphone popup
  Then the judge dismisses the change camera popup
	When the user navigates back to the hearing list
	Then the user is on the Hearing List page
	And the users status has updated to Disconnected

@VIH-4233
Scenario: Participant hearing is delayed
	Given the Participant user has progressed to the Waiting Room page with a hearing in -10 minutes time
	Then the user is on the Waiting Room page
	And the users status has updated to Available
	And the user can see the hearing is delayed title
	And the user can see a yellow box and a delayed message

@VIH-4233
Scenario: Participant is in the waiting room early
	Given the Participant user has progressed to the Waiting Room page with a hearing in 10 minutes time
	Then the user is on the Waiting Room page
	And the users status has updated to Available
	And the user can see the hearing is scheduled title
	And the user can see a blue box and a scheduled message	

@VIH-6131
Scenario: Observer and Panel Member visible on Judge Waiting Room
  Given I have a hearing with an Observer and Panel Member
  And the Judge user has progressed to the Waiting Room page for the existing hearing
  Then the Judge can see a list of participants and their representatives

@VIH-6131
Scenario: Observer and Panel Member visible on Participant Waiting Room
  Given I have a hearing with an Observer and Panel Member
  And the Participant user has progressed to the Waiting Room page for the existing hearing
  Then the Participant can see a list of participants and their representatives

@VIH-6131 @Smoketest-Extended
Scenario: Observer Waiting Room
  Given I have a hearing with an Observer and Panel Member
  And the Observer user has progressed to the Waiting Room page for the existing hearing
  Then the user is on the Waiting Room page
	And a phone number for help is provided
	And the users status has updated to Available
	And the participant can see information about their case
	And the Participant can see a list of participants and their representatives
	And the user can see a black box and an about to begin message

@VIH-6131 @Smoketest-Extended
Scenario: Panel Member Waiting Room
  Given I have a hearing with an Observer and Panel Member
  And the Panel Member user has progressed to the Waiting Room page for the existing hearing
  Then the user is on the Waiting Room page
	And a phone number for help is provided
	And the users status has updated to Available
	And the participant can see information about their case
	And the Panel Member can see a list of participants and their representatives
	And the user can see a blue box and a scheduled message
  And they can see other participants status

@VIH-6420 @Smoketest-Extended
Scenario: Winger Waiting Room
  Given I have a CACD hearing with a Winger
  And the Winger user has progressed to the Waiting Room page for the existing hearing
  Then the user is on the Waiting Room page
	And a phone number for help is provided
	And the users status has updated to Available
	And the participant can see information about their case
	And the Winger can see a list of participants and their representatives
	And the user can see a blue box and a scheduled message
  And they can see other participants status
