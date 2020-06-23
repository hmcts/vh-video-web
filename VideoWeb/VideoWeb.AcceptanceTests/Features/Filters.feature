Feature: Filters
	In order to make it easier to manage several hearings
	As a Video Hearings Officer
	I want to limit the number of displayed hearings

Scenario: VHO filters hearings by Judge name
  Given I have a hearing with a Judge
  And I have another hearing with another Judge
  And the Video Hearings Officer user has progressed to the VHO Venue List page for the existing hearing
  When the VHO selects the hearings for Judge named Automation Courtroom 01
  And the VHO confirms their allocation selection
  Then the hearings are filtered by the judge named Automation Courtroom 01
