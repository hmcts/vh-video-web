@VIH-4127 @VIH-4131 @VIH-4233
Feature: Waiting Room
	As a registered video hearings user
	I need to access a waiting room prior to my hearing
	So that I am ready for the video hearing to begin

@VIH-4233
Scenario: Individual waiting room
	Given the Individual user has progressed to the Waiting Room page
	Then the user is on the Waiting Room page
	And the participant status will be updated to Available
	And the participant can see information about their case
	And the user can see a list of participants and their representatives
	And the user can see the hearing is about to begin title
	And the user can see a black box and an about to begin message

@VIH-4233
Scenario: Representative waiting room
	Given the Representative user has progressed to the Waiting Room page
	Then the user is on the Waiting Room page
	And the participant status will be updated to Available
	And the participant can see information about their case 
	And the user can see a list of participants and their representatives
	And the user can see the hearing is about to begin title
	And the user can see a black box and an about to begin message

@smoketest @VIH-4610
Scenario: Clerk waiting room
	Given the Clerk user has progressed to the Waiting Room page
	Then the user is on the Waiting Room page
	And the participant status will be updated to Joining
	And the Clerk can see information about their case 
	And the user can see other participants status
	And the participant status will be updated to Available
	When the user navigates back to the hearing list
	Then the user is on the Hearings List page
	And the participant status will be updated to Joining

@VIH-4233
Scenario: Individual hearing is delayed
	Given the Individual user has progressed to the Waiting Room page with a hearing in -10 minutes time
	Then the user is on the Waiting Room page
	And the participant status will be updated to Available
	And the user can see the hearing is delayed title
	And the user can see a yellow box and a delayed message

@VIH-4233
Scenario: Individual is in the waiting room early
	Given the Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	Then the user is on the Waiting Room page
	And the participant status will be updated to Available
	And the user can see the hearing is scheduled title
	And the user can see a blue box and a scheduled message	

@VIH-4233
Scenario: Representative hearing is delayed
	Given the Representative user has progressed to the Waiting Room page with a hearing in -10 minutes time
	Then the user is on the Waiting Room page
	And the participant status will be updated to Available
	And the user can see the hearing is delayed title
	And the user can see a yellow box and a delayed message

@VIH-4233
Scenario: Representative is in the waiting room early
	Given the Representative user has progressed to the Waiting Room page with a hearing in 10 minutes time
	Then the user is on the Waiting Room page
	And the participant status will be updated to Available
	And the user can see the hearing is scheduled title
	And the user can see a blue box and a scheduled message	