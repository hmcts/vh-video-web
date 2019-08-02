@VIH-4091
Feature: Declaration
	As a registered video hearings user
	I need to declare that I have read and will comply with the rules
	So that I am compliant

Scenario: Participant declaration
	Given the Participant user has progressed to the Declaration page
	Then contact us details are available
	When the user gives their consent
	And the user clicks the Continue button
	Then the user is on the Waiting Room page

Scenario: Participant does not confirm the declaration
	Given the Participant user has progressed to the Declaration page
	Then contact us details are available
	When the user clicks the Continue button
	Then an error appears stating that they must confirm
	And the user is on the Declaration page