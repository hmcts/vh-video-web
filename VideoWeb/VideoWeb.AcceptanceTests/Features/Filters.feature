Feature: Filters
	In order to avoid silly mistakes
	As a math idiot
	I want to be told the sum of two numbers

@VIH-5503
Scenario: VHO filters hearings by alert type
  Given I have a hearing
  And I have another hearing
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
  And the hearing has every type of alert
	Then the Video Hearings Officer user should see a Suspended notification and a Suspended alert
	When the user selects the Suspended alert
	Then the Suspended checkbox is no longer enabled
	And the Suspended alert should be updated with the details of the user that actioned the alert

@VIH-5417
Scenario: VHO Filters list of hearings on the day
