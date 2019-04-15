@VIH-4127
Feature: Waiting Room
	As a registered video hearings user
	I need to access a waiting room prior to my hearing
	So that I am ready for the video hearing to begin

@smoketest
Scenario: Individual waiting room
	Given the Individual user has progressed to the Waiting Room page
	Then contact us details are available
	Then the user is on the Waiting Room page

