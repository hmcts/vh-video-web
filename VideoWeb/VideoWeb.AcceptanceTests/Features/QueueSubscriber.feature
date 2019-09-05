@VIH-4256 @ApiOnly
Feature: QueueSubscriber
	In order to not duplicate data and keep the video-api in sync with the bookings-api
	As a queue subscriber service
	I want to be told of any changes required to sync

Scenario: Hearing Created
	Given I have a hearing
	When I attempt to retrieve the new conference details from the video api
	Then the conference has been created from the booking

Scenario: Hearing Details Updated
	Given I have a hearing and a conference
	When I attempt to update the hearing details
	Then the conference details have been updated

Scenario: Hearing Cancelled
	Given I have a hearing and a conference
	When I attempt to cancel the hearing
	Then the conference has been deleted 
	
@VIH-4702
Scenario: Hearing Deleted
	Given I have a hearing and a conference
	When I attempt to delete the hearing
	Then the conference has been deleted 

Scenario: Participant Added
	Given I have a hearing and a conference
	When I add a participant to the hearing
	Then the participant has been added

@UpdateParticipant
Scenario: Participant Updated
	Given I have a hearing and a conference
	When I update a participant from the hearing
	Then the participant has been updated

Scenario: Participant Removed
	Given I have a hearing and a conference
	When I remove a participant from the hearing
	Then the participant has been removed
