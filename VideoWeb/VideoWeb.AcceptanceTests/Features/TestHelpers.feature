Feature: Test Helpers
	In order to reduce time manual testing
	As a helper
	I want to be able to execute certain funciontality quickly

@Ignore
Scenario: Remove Hearings by Judge Username
	Given I remove all hearings with the judge 'Performance01Judge'

@Ignore
Scenario: Remove Hearings by partial case name
	Given I remove all hearings with partial case name 'Perf-Test''

@Ignore
Scenario: Remove Conferences
	Given I remove all conferences for today containing the case name 'Perf-Test-Case'
