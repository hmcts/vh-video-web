Feature: Private Consultation
	In order for participants in different locations to talk to each other before a hearing
	As a video hearings service
	I want to be able to connect those participants into a private call

@VIH-4134 @Video @Smoketest-Extended
Scenario: Start a private consultation
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with the first Individual's
	And the first Individual's accepts the private consultation from Mrs Automation01 the first Representative's
	Then the first Representative can see the other participant
	And the self view can be open and closed
	When a participant closes the private consultation
	Then the user is on the Waiting Room page
	When in the first Individual's browser
	Then the user is on the Waiting Room page

@VIH-4134
Scenario: Reject a private consultation
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with the first Individual's
	And the first Individual's rejects the private consultation
	Then the the first Representative's user sees a message that the request has been rejected
	And the user is on the Waiting Room page
	When in the first Individual's browser
	Then the user is on the Waiting Room page

@VIH-4134
Scenario: No answer on a private consultation
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with the first Individual's
	And the user does not answer after 2 minutes
	Then the the first Representative's user sees a message that the request has not been answered

@VIH-4134
Scenario: Participants cannot request Private consultation in hard-seating area
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 3 minutes time
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	Then the private consultation link with the first Individual's is not visible

@VIH-4134
Scenario: Participants cannot request Private consultation in delayed seating area
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 1 minute time
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	Then the private consultation link with the first Individual's is not visible

@VIH-4134
Scenario: Participants cannot request Private consultation in suspended seating area
	Given the the first Individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the the first Representative user has progressed to the Waiting Room page for the existing hearing
	And the hearing status changes to Suspended
	Then the private consultation link with the first Individual's is not visible

@VIH-6132
Scenario: Observers cannot request Private consultation
  Given I have a hearing with an Observer and Panel Member
  And the Observer user has progressed to the Waiting Room page for the existing hearing
	Then the private consultation link with the first Individual's is not visible

@VIH-6132
Scenario: Panel Members cannot request Private consultation
  Given I have a hearing with an Observer and Panel Member
  And the Panel Member user has progressed to the Waiting Room page for the existing hearing
  Then the private consultation link with the first Individual's is not visible
