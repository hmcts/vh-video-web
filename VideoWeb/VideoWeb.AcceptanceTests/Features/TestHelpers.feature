Feature: Test Helpers
	In order to reduce time manual testing
	As a helper
	I want to be able to execute certain funciontality quickly

@Ignore
Scenario: Remove Hearings
	Given I remove all hearings with the judge 'judge username'

@Ignore
Scenario: Remove Conferences
	Given I remove all conferences for today containing the case name 'Video Api Integration Test'
