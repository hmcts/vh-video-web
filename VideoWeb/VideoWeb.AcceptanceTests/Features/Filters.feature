Feature: Filters
	In order to make it easier to manage several hearings
	As a Video Hearings Officer
	I want to limit the number of displayed hearings

@VIH-5503 @Ignore
Scenario: VHO filters hearings by alert type
  Given I have a hearing
  And I have another hearing
  And the hearing has every type of alert
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  When the user filters by alert with the options Disconnected,Self-test failed,Cam/mic blocked,Suspended
  Then the hearings are filtered

@VIH-5846 @Smoketest-Extended  @Ignore
Scenario: VHO filters hearings by location
  Given I have a hearing located in Birmingham CFJC
  And I have another hearing located in Manchester CFJC
  And the Video Hearings Officer user has progressed to the VHO Venue List page for the existing hearing
  When the VHO selects the courtroom Manchester CFJC
  And the VHO confirms their allocation selection
  Then the hearings are filtered

@VIH-5417 @Ignore
Scenario: VHO filters hearings by status
  Given I have a hearing
  And I have another hearing in -10 minutes time
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  And the hearing has every type of alert
  When the user filters by status with the options In session,Paused,Suspended,Closed,Delayed
  Then the hearings are filtered

Scenario: VHO filters hearings by Judge name
  Given I have a hearing with a Judge
  And I have another hearing with another Judge
  And the Video Hearings Officer user has progressed to the VHO Venue List page for the existing hearing
  When the VHO selects the hearings for Judge named Automation Courtroom 01
  And the VHO confirms their allocation selection
  Then the hearings are filtered by the judge named Automation Courtroom 01
