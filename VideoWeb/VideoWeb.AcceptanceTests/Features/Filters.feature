Feature: Filters
	In order to make it easier to manage several hearings
	As a Video Hearings Officer
	I want to limit the number of displayed hearings

Scenario: VHO filters hearings by Judge name
  Given I have a hearing with a Judge
  And I have another hearing with another Judge
  And the Video Hearings Officer user has progressed to the VHO Venue List page for the existing hearing
  When the VHO selects the hearings for a Judge named Automation Courtroom 01
  And the VHO confirms their allocation selection
  Then the hearings are filtered by the judge named Automation Courtroom 01

@VIH-5922 @Smoketest-Extended
Scenario: VHO filters hearings by Courtroom Account
  Given I have a hearing with a Judge
  And I have another hearing with another Judge
  And the Video Hearings Officer user has progressed to the VHO Venue List page for the existing hearing
  When the VHO selects the hearings for Judges named Automation Courtroom 01,Automation01
  And the VHO confirms their allocation selection
  Then both hearings are visible
  When the VHO filters by Judge Name Automation Building 01
  Then the hearings are filtered by the judge named Automation Courtroom 01
