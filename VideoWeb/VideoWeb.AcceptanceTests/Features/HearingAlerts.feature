Feature: Hearing Alerts
	As a video hearings officer user
	I would like to login and access the hearing details
	So that I can have an administrate the hearings I am involved in

#@VIH-4417 
@Smoketest-Extended
Scenario: VHO receives media blocked alert
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	When a participant has chosen to block user media
	Then the Video Hearings Officer user should see a Not Started notification and a Media blocked alert
	When the user selects the alert
	Then the alert checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert

#@VIH-4419
Scenario: VHO receives suspended alert
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	When the hearing is suspended
	Then the Video Hearings Officer user should see a Suspended notification and a Hearing suspended alert
	When the user selects the alert
	Then the alert checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert

#@VIH-1630 @VIH-4418
Scenario Outline: VHO receives disconnected alert
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	When a <Participant> has disconnected from the <Room>
	Then the Video Hearings Officer user should see a Not Started notification and a Disconnected alert
	When the user selects the alert
	Then the alert checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert
	Examples: 
	| Participant | Room			  |
	| Judge       | WaitingRoom		  |
	| Judge       | HearingRoom		  |
	| Participant | WaitingRoom       |
	| Participant | HearingRoom       |
	| Participant | ConsultationRoom  |

#@VIH-1630 @VIH-4416
Scenario Outline: VHO receives failed self test alert
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	When a participant has failed the self-test with <Reason>
	Then the Video Hearings Officer user should see a Not Started notification and a <Reason> alert
	When the user selects the alert
	Then the alert checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert
	Examples:
	| Reason						|
	| Failed self-test (Camera)     |
	| Failed self-test (Microphone) |
	| Failed self-test (Video)      |
	| Failed self-test (Bad Score)  |
    | Failed self-test (Incomplete) |

#@VIH-4418
Scenario: VHO does not receive disconnected alert when hearing is closed
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
	When the hearing has been closed
	And a Participant has disconnected from the HearingRoom
	Then the Video Hearings Officer user should not see an alert
