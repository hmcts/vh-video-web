@VIH-4091
Feature: Declaration
	As a registered video hearings user
	I need to declare that I have read and will comply with the rules
	So that I am compliant

Scenario: Individual declaration
	Given the Individual user has progressed to the Declaration page
	Then contact us details are available
	When the user gives their consent
	And the user clicks the Continue button
	Then the user is on the Waiting Room page

Scenario: Representative declaration
	Given the Representative user has progressed to the Declaration page
	Then contact us details are available
	When the user gives their consent
	And the user clicks the Continue button
	Then the user is on the Waiting Room page

Scenario: Individual does not confirm the declaration
	Given the Individual user has progressed to the Declaration page
	Then contact us details are available
	When the user clicks the Continue button
	Then an error appears stating that they must confirm
	And the user is on the Declaration page

Scenario: Representative does not confirm the declaration
	Given the Representative user has progressed to the Declaration page
	Then contact us details are available
	When the user clicks the Continue button
	Then an error appears stating that they must confirm
	And the user is on the Declaration page