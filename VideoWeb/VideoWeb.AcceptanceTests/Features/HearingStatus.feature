Feature: Hearing Status
	In order to keep track of the hearing status of several hearings
	As a Video Hearings Officer
	I want to be able to see an overview of the status of all hearings

@VIH-4195
Scenario Outline: VHO views hearing status
	Given I have a hearing in 5 minutes time
	And I have another hearing
	And the hearing status changes to <Status>
	And a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
  And the VHO selects all the venues
  Then the user is on the Hearing List page
	And the hearings should be in chronological order
	And the Video Hearings Officer user should see a <Status> notification
	Examples: 
	| Status	    | 
	| Not Started |
	| In Session  | 
	| Paused	    | 
	| Suspended   | 

@VIH-4195
Scenario: VHO views Delayed hearing status
	Given I have a hearing in -5 minutes time
	And I have another hearing in -10 minutes time
	And the hearing status changes to Delayed
	And a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
  And the VHO selects all the venues
  Then the user is on the Hearing List page
	And the hearings should be in chronological order
	And the Video Hearings Officer user should see a Delayed notification

@VIH-4195
Scenario: VHO views closed hearings
	Given I have a hearing
	And the hearing status changes to Closed
	And a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
  And the VHO selects all the venues
	Then the user is on the Hearing List page
	And the closedDate attribute should be populated
	And the VHO can see a list of hearings including the new hearing
