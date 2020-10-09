@VIH-4035
Feature: Hearing List
	As a registered video hearings user
	I would like to login and access the hearing details
	So that I can have an overview of all the scheduled hearings I am involved in

Scenario: Participant has 1 or more hearings
	Given I have a hearing
	And a new browser is open for a Participant
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And the participant can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Introduction page

Scenario: Participant has a hearing more than 30 minutes in the future
	Given I have a hearing in 31 minutes time
	And a new browser is open for a Participant
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks on the Start Hearing button
	Then the user is on the Introduction page

Scenario: Participant has no hearings
	Given a new browser is open for a Participant
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And a warning message appears indicating the participant has no hearings scheduled
	And contact us details are available

@VIH-4607
Scenario: Judge has no hearings
	Given a new browser is open for a Judge
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And a warning message appears indicating the Judge has no hearings scheduled
	And contact us details for the Judge are available

@VIH-4607
Scenario: Judge has 1 or more hearings
	Given I have a hearing
	And a new browser is open for a Judge
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And a phone number for help is provided
	And the user can see their details at the top of the hearing list 
	And the Judge can see a list of hearings including the new hearing
	And contact us details for the Judge are available
	When the user clicks on the Start Hearing button
	Then the user is on the Waiting Room page

@VIH-4156 @VIH-4507 @Smoketest
Scenario: Video Hearings Officer has 1 or more hearings
  Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	Then the VHO can see a list of hearings including the new hearing
	When the VHO selects the hearing
	Then the VHO can see the hearing view
	And the VHO should see the participant contact details

@VIH-4559
Scenario: Video Hearings Officer can see all hearings for today only
	Given I have a hearing
	And I have another hearing
	And I have a hearing in 1 days time
	And I have another hearing in 2 days time
	And a new browser is open for a Video Hearings Officer
	When the user attempts to login with valid credentials
  And the VHO selects all the venues
	Then the Video Hearings Officer should only see hearings for today

Scenario: Judge cannot access Closed hearing
	Given I have a hearing
	And the hearing status changes to Closed
  And the Judge user has progressed to the Hearing List page for the existing hearing
  Then the hearing status should be displayed as Closed on the hearing list page
  And the Judge is unable to access the Waiting Room

Scenario: Participant can access Closed hearing within 30 minutes
	Given I have a hearing
	And the hearing status changes to Closed
  And the Individual user has progressed to the Hearing List page for the existing hearing
  Then the participant is able to access the hearing

Scenario: Panel Member has 1 or more hearings
	Given I have a hearing with an Observer and Panel Member
	And a new browser is open for a PanelMember
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And the participant can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Waiting Room page

Scenario: Panel Member has a hearing more than 30 minutes in the future
	Given I have a hearing with an Observer and Panel Member in 31 minutes time
	And a new browser is open for a PanelMember
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks on the Start Hearing button
	Then the user is on the Waiting Room page

@VIH-6420
  Scenario: Winger has 1 or more hearings
	Given I have a CACD hearing with a Winger
	And a new browser is open for a Winger
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And the participant can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Waiting Room page

@VIH-6420
Scenario: Winger has a hearing more than 30 minutes in the future
	Given I have a CACD hearing with a winger in in 31 minutes time
	And a new browser is open for a Winger
	When the user attempts to login with valid credentials
	Then the user is on the Hearing List page
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks on the Start Hearing button
	Then the user is on the Waiting Room page
