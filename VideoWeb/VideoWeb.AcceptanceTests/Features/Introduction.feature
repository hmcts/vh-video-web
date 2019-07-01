Feature: Introduction
	In order to view a summary of what is about to happen in the next screens
	As an individual or representative user
	I want to be told the upcoming process

@VIH-4616
Scenario: Individual Introduction 
	Given the Individual user has progressed to the Introduction page
	Then contact us details are available
	When the user clicks the button with innertext Next
	Then the user is on the Equipment Check page

@VIH-4616
Scenario: Representative Introduction 
	Given the Representative user has progressed to the Introduction page
	Then contact us details are available
	When the user clicks the button with innertext Next
	Then the user is on the Equipment Check page