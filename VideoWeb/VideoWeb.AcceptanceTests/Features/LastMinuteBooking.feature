Feature: LastMinuteBooking
	As a Participant in the hearing 
  I would like to see a a toast alert when a new participant is added to the hearing
  So that all the participants are aware that a new participant has been added

@VIH-8055 @HearingTest @Smoketest-Extended
Scenario: Alert the participants in the hearing
	Given I have a hearing in 20 minutes time with Observer
	And the first Individual user has progressed to the Waiting Room page for the existing hearing
	When I add a participant to the hearing
	Then the participant in the waiting room must see the toast alert
