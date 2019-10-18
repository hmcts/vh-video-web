Feature: Introduction
	In order to view a summary of what is about to happen in the next screens
	As an individual or representative user
	I want to be told the upcoming process

@VIH-4616
Scenario: Participant Introduction 
	Given the Participant user has progressed to the Introduction page
	Then contact us details are available
	And the participant status will be updated to Joining
	When the user clicks the Next button
	Then the user is on the Equipment Check page