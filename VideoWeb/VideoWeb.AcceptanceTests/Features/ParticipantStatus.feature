Feature: Participant Status
	In order to ascertain where each participant is during the sign in process
	As a Video Hearings Officer
	I want to be able to view the status of each participant

@VIH-4500
Scenario Outline: Participants status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	And the VHO can see the participants statuses are Not signed in
	When the participants statuses change to <Status>
	Then the VHO can see the participants statuses have updated to <Status>
	Examples: 
	| Status		      |
	| Joining         |
	| In hearing      |
	| In consultation |
	| Available       |
	| Disconnected    |

@VIH-5431
Scenario Outline: Judge status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	And the VHO can see the Judge status is Unavailable
	When the Judge status changes to <Status>
	Then the VHO can see the Judge status has updated to <Status>
  Examples: 
  | Status          |
	| Available       |
  | In hearing      |
  | In consultation |
  | Disconnected    |
  
@VIH-5431
Scenario: Judge in another hearing
  Given I have a hearing
  And the Judge status is set to In hearing
	And I have another hearing
  When the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  Then the VHO can see the Judge status is In another hearing

@VIH-5431
Scenario: Judge in another waiting room after disconnection
  Given I have a hearing
  And the Judge status is set to Disconnected
	And I have another hearing
  When the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  Then the VHO can see the Judge status is Unavailable
