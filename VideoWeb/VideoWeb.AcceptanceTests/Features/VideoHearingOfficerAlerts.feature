Feature: Video Hearing Officer Alerts
	As a video hearings officer user
	I would like to login and access the hearing details
	So that I can have an administrate the hearings I am involved in

@VIH-4417
Scenario: Video Hearings Officer receieves media blocked alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When a participant has chosen to block user media
	Then the Video Hearings Officer user should see a Ready notification and a Media blocked alert
	When the user selects the Media blocked alert
	Then the Media blocked checkbox is no longer enabled
	And the Media blocked alert should be updated with the details of the user that actioned the alert

@VIH-4419
Scenario: Video Hearings Officer receieves suspended alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When the judge has disconnected from the hearing
	Then the Video Hearings Officer user should see a Suspended notification and a Suspended alert
	When the user selects the Suspended alert
	Then the Suspended checkbox is no longer enabled
	And the Suspended alert should be updated with the details of the user that actioned the alert

@VIH-1630 @VIH-4418
Scenario Outline: Video Hearings Officer receieves disconnected alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When a <Participant> has disconnected from the <Room>
	Then the Video Hearings Officer user should see a <Notification> notification and a Disconnected alert
	When the user selects the Disconnected alert
	Then the Disconnected checkbox is no longer enabled
	And the Disconnected alert should be updated with the details of the user that actioned the alert
	Examples: 
	| Participant | Room			  | Notification |
	| Judge       | WaitingRoom		  | Suspended	 |
	| Judge       | HearingRoom		  | Suspended	 |
	| Participant | WaitingRoom       | Ready		 |
	| Participant | HearingRoom       | Ready		 |
	| Participant | ConsultationRoom1 | Ready		 |

@VIH-1630
Scenario: Video Hearings Officer receieves failed self test alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When a participant has failed the self-test
	Then the Video Hearings Officer user should see a Ready notification and a Failed self test alert
	When the user selects the Failed self test alert
	Then the Failed self test checkbox is no longer enabled
	And the Failed self test alert should be updated with the details of the user that actioned the alert

@VIH-4418
Scenario: Video Hearings Officer does not receive disconnected alert when hearing is closed
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When the hearing has been closed
	And a Participant has disconnected from the HearingRoom
	Then the Video Hearings Officer user should not see an alert

@VIH-4559
Scenario: Video Hearings Officer can see all hearings for today only
	Given I have a hearing and a conference
	And I have another hearing and a conference
	And I have a hearing and a conference in 1 days time
	And I have another hearing and a conference in 2 days time
	When the Video Hearings Officer attempts to login with valid credentials
	Then the Video Hearings Officer should only see 2 hearings