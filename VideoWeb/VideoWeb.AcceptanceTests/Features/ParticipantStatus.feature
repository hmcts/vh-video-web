Feature: Participant Status
	In order to ascertain where each participant is during the sign in process
	As a Video Hearings Officer
	I want to be able to view the status of each participant

@VIH-4500
Scenario Outline: Participants status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the VHO can see the participants statuses are Not signed in
	When the participants statuses are <Status>
	Then the VHO can see the participants statuses have updated to <Status>
	Examples: 
	| Status		      |
	| Joining         |
	| In hearing      |
	| In consultation |
	| Available       |
	| Disconnected    |

@VIH-5431
Scenario Outline: Clerk status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the VHO can see the clerk status is Unavailable
	When the clerk status is <Status>
	Then the VHO can see the clerk status has updated to <Status>
  Examples: 
  | Status       |
	| Available    |
  | In hearing   |
  | Disconnected |
  
@VIH-5431
Scenario: Clerk in another hearing
  Given I have a hearing
  And the clerk status is In hearing
	And I have another hearing
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  Then the VHO can see the clerk status is In another hearing

@VIH-5431
Scenario: Clerk in another waiting room after disconnection
  Given I have a hearing
  And the clerk status is Disconnected
  And the clerk status is Available
	And I have another hearing
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  Then the VHO can see the clerk status is Unavailable
