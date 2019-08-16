﻿Feature: Private Consultation
	In order for participants in different locations to talk to each other before a hearing
	As a video hearings service
	I want to be able to connect those participants into a private call

@VIH-4134 @Video @Chrome
Scenario: Start a private consultation
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 30 minutes time
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with Individual01
	And Individual01 accepts the private consultation
	Then Representative01 can see the other participant
	And the self view can be open and closed
	When a participant closes the private consultation
	Then the user is on the Waiting Room page
	When in Individual01's browser
	Then the user is on the Waiting Room page

@VIH-4134
Scenario: Reject a private consultation
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 30 minutes time
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with Individual01
	And Individual01 rejects the private consultation
	Then the Representative01 user sees a message that the request has been rejected
	And the user is on the Waiting Room page
	When in Individual01's browser
	Then the user is on the Waiting Room page

@VIH-4134
Scenario: Participants cannot request Private consultation in hard-seating area
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 3 minutes time
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	Then the private consultation link with Individual01 is not visible

@VIH-4134
Scenario: Participants cannot request Private consultation in delayed seating area
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 1 minute time
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	Then the private consultation link with Individual01 is not visible

@VIH-4134
Scenario: Participants cannot request Private consultation in suspended seating area
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 30 minutes time
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	And the hearing status changes to Suspended
	Then the private consultation link with Individual01 is not visible