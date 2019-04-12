@VIH-4037
Feature: Rules
	As a registered video hearings user
	I need to see a list of rules regarding participating in a video hearing 
	So that I can comply

Scenario: Individual rules list
	Given the Individual user has progressed to the Rules page
	Then contact us details are available
	And the HMCTS Crest is visible
	When the user clicks the Continue button
	Then the user is on the Declaration page

Scenario: Representative rules list
	Given the Representative user has progressed to the Rules page
	Then contact us details are available
	And the HMCTS Crest is visible
	When the user clicks the Continue button
	Then the user is on the Declaration page