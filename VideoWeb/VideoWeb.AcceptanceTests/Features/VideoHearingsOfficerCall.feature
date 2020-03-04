Feature: Video Hearings Officer Call
	In order for a participant to talk to a VHO
	As a VHO
	I want to be able to call a participant

@VIH-4611 @VIH-4613 @VIH-4730 @Video
Scenario: Video Hearings Officer Call
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with Individual01
	And Individual01 accepts the VHO call
	Then the Video Hearings Officer can see and hear the other user
	And the admin self view can be open and closed
	Then the Individual01 can see and hear the other user
	When the Video Hearings Officer ends the call
	Then the user is on the Hearing List page

@VIH-4613
Scenario: No Answer on a Video Hearings Officer Call
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	When the Video Hearings Officer starts a call with Individual01
	And the user does not answer after 2 minutes
	Then the Individual01 user can no longer see the alert

@VIH-4613 @Video
Scenario: Video Hearings Officer cannot call users in private consultation
	Given the Individual01 user has progressed to the Waiting Room page with a hearing in 10 minutes time
	And the Representative01 user has progressed to the Waiting Room page for the existing hearing
	When the user starts a private consultation with Individual01
	And Individual01 accepts the private consultation 
	Then Representative01 can see the other participant
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	Then the option to call Individual01 is not visible

@VIH-4613 @Video
Scenario: Video Hearings Officer cannot call users in a hearing
	Given the Individual01 user has progressed to the Waiting Room page
	And the Clerk user has progressed to the Waiting Room page for the existing hearing
	When the Clerk starts the hearing
	Then the user is on the Countdown page
	When the countdown finishes
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page for the existing hearing
	Then the option to call Individual01 is not visible
