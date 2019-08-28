Feature: Hearing Status
	In order to keep track of the hearing status of several hearings
	As a Video Hearings Officer
	I want to be able to see an overview of the status of all hearings

@VIH-4195
Scenario Outline: Video Hearings Officer views hearing status
	Given I have a hearing and a conference in 2 minutes time
	And I have another hearing and a conference
	And the hearing status changes to <Status>
	And a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
	Then the user is on the VHO Hearing List page
	And the hearings should be in chronological order
	And the Video Hearings Officer user should see a <Status> notification
	Examples: 
	| Status	  | 
	| Not Started | 
	| Delayed     | 
	| In Session  | 
	| Paused	  | 
	| Suspended   | 

@VIH-4195
Scenario: Video Hearings Officer views closed hearings
	Given I have a hearing and a conference
	And the hearing status changes to Closed
	And a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
	Then the user is on the VHO Hearing List page
	And the closedDate attribute should be populated
	And the VHO can see a list of hearings including the new hearing