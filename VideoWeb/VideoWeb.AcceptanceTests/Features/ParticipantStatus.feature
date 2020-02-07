Feature: Participant Status
	In order to ascertain where each participant is during the sign in process
	As a Video Hearings Officer
	I want to be able to view the status of each participant

@VIH-4500
Scenario Outline: Participants status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the participants statuses should be Not Signed In
	When the participants are <Status>
	Then the participants statuses should update to <Status>
	Examples: 
	| Status		      |
	| Joining         |
	| In Hearing      |
	| In Consultation |
	| Available       |
	| Disconnected    |

  @VIH-5431
 Scenario: Clerk status updates
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the clerk status should be Unavailable
	When the clerk is Available
	Then the clerk status should update to Available
