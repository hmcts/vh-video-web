Feature: Hearing Status
	In order to keep track of the hearing status of several hearings
	As a Video Hearings Officer
	I want to be able to see an overview of the status of all hearings

@VIH-4195
Scenario Outline: Video Hearings Officer views hearing status
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When the hearing status changes to <Status>
	Then the Video Hearings Officer user should see a <Status> notification
	Examples: 
	| Status	  | 
	| Not Started | 
	| Delayed     | 
	| In Session  | 
	| Paused	  | 
	| Suspended   | 

@VIH-4195
Scenario: Video Hearings Officer views closed hearings
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When the hearing status changes to Closed
	Then the closedDate attribute should be populated
