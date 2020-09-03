Feature: Filters
	In order to make it easier to manage several hearings
	As a Video Hearings Officer
	I want to limit the number of displayed hearings

@VIH-5922 @Smoketest-Extended
Scenario: VHO filters hearings by Courtroom Account
  Given I have a hearing with a Judge
  And I have another hearing with another Judge
  And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  When the VHO filters the hearings for both Judges
  Then both hearings are visible
  When the VHO filters by the second Judge
  Then the hearings are filtered
