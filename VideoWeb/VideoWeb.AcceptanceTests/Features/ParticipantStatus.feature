Feature: Participant Status
	In order to ascertain where each participant is during the sign in process
	As a Video Hearings Officer
	I want to be able to view the status of each participant

@VIH-4500
Scenario Outline: Participants status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the participants statuses should be Not Signed In
	When the participants statuses are <Status>
	Then the participants statuses should update to <Status>
	Examples: 
	| Status		      |
	| Joining         |
	| In Hearing      |
	| In Consultation |
	| Available       |
	| Disconnected    |

@VIH-5431
Scenario Outline: Clerk status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the clerk status should be Unavailable
	When the clerk status is <Status>
	Then the clerk status should update to <Status>
  Examples: 
  | Status       |
	| Available    |
  | In Hearing   |
  | Disconnected |
  
@VIH-5431
Scenario: Clerk in another hearing
  Given I have a hearing and a conference
  And the clerk status is In Hearing
	And I have another hearing and a conference 
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  Then the clerk status should be In another hearing

@VIH-5431
Scenario: Clerk in another waiting room after disconnection
  Given I have a hearing and a conference
  And the clerk status is Disconnected
  And the clerk status is Available
	And I have another hearing and a conference 
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  Then the clerk status should be Unavailable
