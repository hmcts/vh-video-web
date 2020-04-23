Feature: Filters
	In order to make it easier to manage several hearings
	As a Video Hearings Officer
	I want to limit the number of displayed hearings

@VIH-5503
Scenario: VHO filters hearings by alert type
  Given I have a hearing
  And I have another hearing
  And the hearing has every type of alert
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  When the user filters by alert with the options Disconnected,Self-test failed,Cam/mic blocked,Suspended
  Then the hearings are filtered

@VIH-5417 @Smoketest-Extended
Scenario: VHO filters hearings by status
  Given I have a hearing
  And I have another hearing in -10 minutes time
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  And the hearing has every type of alert
  When the user filters by status with the options In session,Paused,Suspended,Closed,Delayed
  Then the hearings are filtered
