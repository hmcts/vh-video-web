Feature: Private Consultation
	In order for participants in different locations to talk to each other before a hearing
	As a video hearings service
	I want to be able to connect those participants into a private call

@VIH-4134 @Video @Chrome
Scenario: Start a private consultation
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 30 minutes time
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with Individual01
	And Individual01 accepts the private consultation
	Then the participants can talk to each other